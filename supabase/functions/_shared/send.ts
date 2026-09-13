// The send pipeline, shared by send-mail (user-triggered) and
// dispatch-scheduled (cron-triggered).
//
// Shape of the thing: sending is split into "queue" and "drain".
//
//   queue  -- one row per recipient, status 'queued', in a single statement.
//             Cheap and bounded, so it always finishes inside one request.
//   drain  -- takes a slice of the queue, personalizes, hands it to the
//             provider, records the outcome.
//
// The split is what makes a 50,000-address campaign survive an Edge Function
// wall-clock limit. A drain that runs out of time simply stops; the rows it
// never reached are still 'queued' and the next cron tick picks them up. Nothing
// is lost and nothing is sent twice, because (mail_id, recipient_id) is unique
// and a row leaves 'queued' only once.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { getProvider, type OutboundEmail } from './email/index.ts'
import { personalize, personalizeSubject } from './personalize.ts'

export type MailRow = {
  id: string
  owner_id: string
  title: string
  status: string
  subject: string
  preheader: string
  sender_name: string
  sender_email: string
  reply_to_email: string
  rendered_html: string | null
  scheduled_at: string | null
}

/** How many messages one invocation will attempt before yielding to the next tick. */
const DRAIN_LIMIT = 500

export type QueueOutcome = { queued: number; suppressed: number }

export const queueDeliveries = async (
  admin: SupabaseClient,
  mail: MailRow,
): Promise<QueueOutcome> => {
  const { data: recipients, error } = await admin
    .from('mail_recipients')
    .select('id, email')
    .eq('mail_id', mail.id)

  if (error) throw new Error(`loading recipients: ${error.message}`)
  if (!recipients?.length) return { queued: 0, suppressed: 0 }

  // A previous unsubscribe or hard bounce outranks the campaign. Checking the
  // suppression list here rather than at drain time means a suppressed address
  // is visibly accounted for on the mail instead of quietly vanishing.
  const { data: suppressed, error: suppErr } = await admin
    .from('suppressions')
    .select('email')
    .eq('owner_id', mail.owner_id)

  if (suppErr) throw new Error(`loading suppressions: ${suppErr.message}`)

  const blocked = new Set((suppressed ?? []).map((s) => s.email.toLowerCase()))

  const rows = recipients.map((r) => ({
    mail_id: mail.id,
    recipient_id: r.id,
    status: blocked.has(r.email.toLowerCase()) ? 'suppressed' : 'queued',
  }))

  // ignoreDuplicates: re-queueing an already-queued mail is a no-op rather than
  // an error, which is what makes the dispatcher safe to retry.
  const { error: insertErr } = await admin
    .from('mail_deliveries')
    .upsert(rows, { onConflict: 'mail_id,recipient_id', ignoreDuplicates: true })

  if (insertErr) throw new Error(`queueing deliveries: ${insertErr.message}`)

  const suppressedCount = rows.filter((r) => r.status === 'suppressed').length
  return { queued: rows.length - suppressedCount, suppressed: suppressedCount }
}

export type DrainOutcome = { attempted: number; sent: number; failed: number; remaining: number }

export const drainMail = async (
  admin: SupabaseClient,
  mail: MailRow,
  limit = DRAIN_LIMIT,
): Promise<DrainOutcome> => {
  if (!mail.rendered_html) throw new Error('mail has no rendered_html snapshot')

  const { data: business } = await admin
    .from('business_profiles')
    .select('business_name')
    .eq('user_id', mail.owner_id)
    .maybeSingle()

  const businessName = business?.business_name ?? ''

  const { data: pending, error } = await admin
    .from('mail_deliveries')
    .select('id, recipient_id, mail_recipients ( id, email, fields )')
    .eq('mail_id', mail.id)
    .eq('status', 'queued')
    .limit(limit)

  if (error) throw new Error(`loading queue: ${error.message}`)
  if (!pending?.length) return { attempted: 0, sent: 0, failed: 0, remaining: 0 }

  const provider = getProvider()
  const from = mail.sender_name
    ? `${mail.sender_name} <${mail.sender_email}>`
    : mail.sender_email

  // Build the whole slice first. Personalization is pure string work and hashing;
  // doing it up front keeps the provider calls back to back rather than
  // interleaved with CPU work.
  const prepared: Array<{ deliveryId: string; message: OutboundEmail }> = []

  for (const row of pending) {
    const recipient = row.mail_recipients as unknown as
      | { id: string; email: string; fields: Record<string, string> }
      | null
    if (!recipient) continue

    const ctx = {
      mailId: mail.id,
      recipientId: recipient.id,
      email: recipient.email,
      fields: recipient.fields ?? {},
      businessName,
    }

    prepared.push({
      deliveryId: row.id as string,
      message: {
        to: recipient.email,
        from,
        replyTo: mail.reply_to_email || undefined,
        subject: personalizeSubject(mail.subject, ctx),
        html: await personalize(mail.rendered_html, ctx),
      },
    })
  }

  let sent = 0
  let failed = 0

  for (let i = 0; i < prepared.length; i += provider.maxBatch) {
    const chunk = prepared.slice(i, i + provider.maxBatch)
    const results = await provider.send(chunk.map((c) => c.message))

    // Results come back positionally. Updating one row per result is more calls
    // than a bulk upsert, but each delivery carries its own provider message id
    // and error, and losing that detail is what makes a bounce untraceable later.
    await Promise.all(
      results.map((result, idx) => {
        const target = chunk[idx]
        if (result.ok) sent++
        else failed++
        return admin
          .from('mail_deliveries')
          .update({
            status: result.ok ? 'sent' : 'failed',
            provider: provider.name,
            provider_message_id: result.messageId ?? null,
            error: result.error ?? null,
          })
          .eq('id', target.deliveryId)
      }),
    )
  }

  const { count } = await admin
    .from('mail_deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('mail_id', mail.id)
    .eq('status', 'queued')

  return { attempted: prepared.length, sent, failed, remaining: count ?? 0 }
}

/**
 * Moves the mail out of 'sending' once its queue is empty.
 *
 * 'failed' is reserved for a campaign where nothing at all got out -- a bad API
 * key, an unverified domain. A campaign where most messages landed and a handful
 * bounced is 'sent'; the per-recipient failures live on the delivery rows, which
 * is where a user can actually act on them.
 */
export const finalizeMail = async (
  admin: SupabaseClient,
  mail: MailRow,
): Promise<'sent' | 'sending' | 'failed'> => {
  const counts = await Promise.all(
    (['queued', 'sent', 'failed'] as const).map(async (status) => {
      const { count } = await admin
        .from('mail_deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('mail_id', mail.id)
        .eq('status', status)
      return [status, count ?? 0] as const
    }),
  )
  const byStatus = Object.fromEntries(counts) as Record<'queued' | 'sent' | 'failed', number>

  if (byStatus.queued > 0) return 'sending'

  const everythingFailed = byStatus.sent === 0 && byStatus.failed > 0
  const next = everythingFailed ? 'failed' : 'sent'

  await admin
    .from('mails')
    .update({
      status: next,
      sent_at: next === 'sent' ? new Date().toISOString() : null,
      send_error: everythingFailed ? 'every delivery failed; check provider credentials' : null,
    })
    .eq('id', mail.id)

  return next
}
