// POST /functions/v1/send-mail
//
// Called by the Send / Schedule modal. Body:
//   {
//     mailId:       uuid,
//     renderedHtml: string,          // from the client's own generateHtml()
//     subject?:     string,
//     preheader?:   string,
//     scheduledAt?: string | null    // ISO; future => schedule instead of send
//   }
//
// Ownership is not checked with an `if` here. The mail is read and updated
// through a client carrying the caller's JWT, so RLS decides what is visible --
// a forged mailId simply returns no rows.

import { preflight, json, fail, corsHeaders } from '../_shared/http.ts'
import { adminClient, requireUser } from '../_shared/supabase.ts'
import { queueDeliveries, drainMail, finalizeMail, type MailRow } from '../_shared/send.ts'
import { optionalEnv } from '../_shared/env.ts'

type Body = {
  mailId?: string
  renderedHtml?: string
  subject?: string
  preheader?: string
  scheduledAt?: string | null
}

const MAIL_COLUMNS =
  'id, owner_id, title, status, subject, preheader, sender_name, sender_email, reply_to_email, rendered_html, scheduled_at'

Deno.serve(async (req: Request) => {
  const pre = preflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return fail('method not allowed', 405)

  try {
    const { client, user } = await requireUser(req)
    if (!user) return fail('unauthorized', 401)

    const body = (await req.json().catch(() => ({}))) as Body
    if (!body.mailId) return fail('mailId is required')
    if (!body.renderedHtml?.trim()) {
      return fail('renderedHtml is required: the client generator is the source of truth for markup')
    }

    const { data: existing, error: readErr } = await client
      .from('mails')
      .select(MAIL_COLUMNS)
      .eq('id', body.mailId)
      .maybeSingle()

    if (readErr) return fail(readErr.message, 400)
    if (!existing) return fail('mail not found', 404)
    if (existing.status === 'sent' || existing.status === 'sending') {
      return fail(`mail is already ${existing.status}`, 409)
    }

    // --- preflight validation ------------------------------------------------
    const subject = (body.subject ?? existing.subject).trim()
    if (!subject) return fail('a subject is required before sending')

    const { data: sender } = await client
      .from('sender_profiles')
      .select('sender_name, sender_email, reply_to_email, is_verified')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!sender?.sender_email) {
      return fail('set a sender address in Settings before sending', 422)
    }
    // Off by default so the pipeline is usable end to end on a fresh project;
    // turn it on once a real sending domain is verified with the provider.
    if (optionalEnv('REQUIRE_VERIFIED_SENDER', 'false') === 'true' && !sender.is_verified) {
      return fail('sender address is not verified', 422)
    }

    const { count: recipientCount } = await client
      .from('mail_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('mail_id', body.mailId)

    if (!recipientCount) return fail('add at least one recipient before sending', 422)

    // --- snapshot ------------------------------------------------------------
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    const isFuture = scheduledAt !== null && scheduledAt.getTime() > Date.now()

    const patch = {
      subject,
      preheader: body.preheader ?? existing.preheader,
      rendered_html: body.renderedHtml,
      sender_name: sender.sender_name ?? '',
      sender_email: sender.sender_email,
      reply_to_email: sender.reply_to_email ?? sender.sender_email,
      scheduled_at: isFuture ? scheduledAt.toISOString() : null,
      status: isFuture ? 'scheduled' : existing.status,
      send_error: null,
    }

    const { data: updated, error: updateErr } = await client
      .from('mails')
      .update(patch)
      .eq('id', body.mailId)
      .select(MAIL_COLUMNS)
      .single()

    if (updateErr) return fail(updateErr.message, 400)

    // Scheduling is just a state change. pg_cron will pick it up from here, and
    // the HTML snapshot taken above is what actually goes out -- so editing the
    // document afterwards does not silently change a scheduled campaign.
    if (isFuture) {
      return json({
        status: 'scheduled',
        scheduledAt: patch.scheduled_at,
        recipientCount,
        mail: updated,
      })
    }

    // --- send now ------------------------------------------------------------
    // From here on the service role drives it: 'sending' and 'sent' are states
    // RLS forbids the client from setting for itself.
    const admin = adminClient()
    const mail = { ...(updated as MailRow), status: 'sending' }

    await admin.from('mails').update({ status: 'sending' }).eq('id', mail.id)

    try {
      const queued = await queueDeliveries(admin, mail)
      const drained = await drainMail(admin, mail)
      const finalStatus = await finalizeMail(admin, mail)

      return json({ status: finalStatus, ...queued, ...drained })
    } catch (err) {
      // Park it as failed with the reason attached rather than leaving it stuck
      // in 'sending', where nothing would ever retry it and the UI would show a
      // campaign frozen mid-flight.
      const message = err instanceof Error ? err.message : String(err)
      await admin
        .from('mails')
        .update({ status: 'failed', send_error: message })
        .eq('id', mail.id)
      return fail(message, 500, { status: 'failed' })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
