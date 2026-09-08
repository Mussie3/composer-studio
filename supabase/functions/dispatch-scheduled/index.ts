// POST /functions/v1/dispatch-scheduled
//
// Woken once a minute by pg_cron (see 20260907090800_scheduling.sql). Two jobs:
//
//   1. claim scheduled mails whose time has come and queue their deliveries
//   2. drain whatever is still queued -- including leftovers from a previous
//      tick that ran out of wall clock
//
// Step 2 is why a large campaign finishes without a queue service: each tick
// takes another slice, and the mail only leaves 'sending' when the queue is
// empty.

import { json, fail } from '../_shared/http.ts'
import { adminClient } from '../_shared/supabase.ts'
import { queueDeliveries, drainMail, finalizeMail, type MailRow } from '../_shared/send.ts'

const MAILS_PER_TICK = 10

// Guard against a tick overrunning the function's wall clock and being killed
// mid-batch. Stopping early is free -- the remainder stays queued.
const TICK_BUDGET_MS = 45_000

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return fail('method not allowed', 405)

  const startedAt = Date.now()
  const admin = adminClient()
  const report: Array<Record<string, unknown>> = []

  try {
    // --- 1. newly due -------------------------------------------------------
    // claim_due_mails flips them to 'sending' under FOR UPDATE SKIP LOCKED, so
    // two overlapping ticks cannot claim the same mail.
    const { data: claimed, error: claimErr } = await admin.rpc('claim_due_mails', {
      p_limit: MAILS_PER_TICK,
    })
    if (claimErr) return fail(`claim failed: ${claimErr.message}`, 500)

    for (const mail of (claimed ?? []) as MailRow[]) {
      try {
        const queued = await queueDeliveries(admin, mail)
        report.push({ mailId: mail.id, phase: 'claimed', ...queued })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await admin
          .from('mails')
          .update({ status: 'failed', send_error: message })
          .eq('id', mail.id)
        report.push({ mailId: mail.id, phase: 'claimed', error: message })
      }
    }

    // --- 2. drain everything in flight --------------------------------------
    const { data: inFlight, error: flightErr } = await admin
      .from('mails')
      .select(
        'id, owner_id, title, status, subject, preheader, sender_name, sender_email, reply_to_email, rendered_html, scheduled_at',
      )
      .eq('status', 'sending')
      .limit(MAILS_PER_TICK)

    if (flightErr) return fail(`load in-flight failed: ${flightErr.message}`, 500)

    for (const mail of (inFlight ?? []) as MailRow[]) {
      if (Date.now() - startedAt > TICK_BUDGET_MS) {
        report.push({ phase: 'budget-exhausted', deferred: true })
        break
      }
      try {
        const drained = await drainMail(admin, mail)
        const status = await finalizeMail(admin, mail)
        report.push({ mailId: mail.id, phase: 'drained', status, ...drained })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await admin
          .from('mails')
          .update({ status: 'failed', send_error: message })
          .eq('id', mail.id)
        report.push({ mailId: mail.id, phase: 'drained', error: message })
      }
    }

    return json({ ok: true, elapsedMs: Date.now() - startedAt, report })
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err), 500)
  }
})
