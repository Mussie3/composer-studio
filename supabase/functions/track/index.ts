// GET /functions/v1/track/{open|click|unsubscribe}?t=<signed token>
//
// Deployed with verify_jwt = false: the callers are mail clients and browsers
// that have never heard of a Supabase JWT. Authentication is the HMAC on the
// token instead -- see _shared/signing.ts. Without it, anyone could POST
// arbitrary opens and clicks and the entire Usage dashboard would be fiction.
//
// Every handler writes through the service role, because an anonymous request
// has no identity RLS could evaluate.

import { adminClient } from '../_shared/supabase.ts'
import { verifyToken } from '../_shared/signing.ts'

// 1x1 transparent GIF.
const PIXEL = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
  (c) => c.charCodeAt(0),
)

const pixelResponse = () =>
  new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      // Without these, a caching proxy answers the second open from cache and
      // repeat opens stop being recorded at all.
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
    },
  })

const clientMeta = (req: Request) => {
  const forwarded = req.headers.get('x-forwarded-for') ?? ''
  const ip = forwarded.split(',')[0]?.trim()
  return {
    user_agent: req.headers.get('user-agent') ?? null,
    // Only store it if it parses as an address; inet rejects junk and would
    // fail the whole insert, losing the event over a malformed header.
    ip: /^[0-9a-f:.]+$/i.test(ip ?? '') ? ip : null,
  }
}

const htmlPage = (title: string, message: string, status = 200) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;
       font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;
       background:#f6f5fb;color:#1f2033}
  .card{max-width:32rem;padding:2.5rem;background:#fff;border-radius:16px;
        box-shadow:0 12px 40px rgba(31,32,51,.08);text-align:center}
  h1{margin:0 0 .5rem;font-size:1.25rem;letter-spacing:-.02em}
  p{margin:0;color:#5b5c73}
</style>
<div class="card"><h1>${title}</h1><p>${message}</p></div>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const action = url.pathname.split('/').filter(Boolean).pop()
  const token = url.searchParams.get('t') ?? ''
  const claims = await verifyToken(token)

  // An open pixel must never render as a broken image, even for a bad token --
  // that would be visible inside someone's email. Fail silently, log nothing.
  if (!claims) {
    if (action === 'open') return pixelResponse()
    if (action === 'click') {
      const target = url.searchParams.get('u')
      return target
        ? Response.redirect(decodeURIComponent(target), 302)
        : htmlPage('Link expired', 'This link is no longer valid.', 400)
    }
    return htmlPage('Link expired', 'This link is no longer valid.', 400)
  }

  const admin = adminClient()
  const { mailId, recipientId } = claims

  switch (action) {
    case 'open': {
      await admin.from('mail_events').insert({
        mail_id: mailId,
        recipient_id: recipientId,
        type: 'open',
        ...clientMeta(req),
      })
      return pixelResponse()
    }

    case 'click': {
      const raw = url.searchParams.get('u')
      if (!raw) return htmlPage('Missing link', 'This link has no destination.', 400)
      const target = decodeURIComponent(raw)

      // Only http(s) is followed. Without this the tracker would happily bounce
      // a reader to a javascript: or data: URL supplied by whoever built the
      // link -- an open redirect wearing our domain.
      if (!/^https?:\/\//i.test(target)) {
        return htmlPage('Blocked link', 'This link points somewhere unsafe.', 400)
      }

      // A click implies an open. Recording both means the funnel still reads
      // correctly for clients that block images but follow links.
      await admin.from('mail_events').insert([
        { mail_id: mailId, recipient_id: recipientId, type: 'click', url: target, ...clientMeta(req) },
        { mail_id: mailId, recipient_id: recipientId, type: 'open', ...clientMeta(req) },
      ])

      return Response.redirect(target, 302)
    }

    case 'unsubscribe': {
      const { data: recipient } = await admin
        .from('mail_recipients')
        .select('email, mails ( owner_id )')
        .eq('id', recipientId)
        .maybeSingle()

      if (!recipient) return htmlPage('Not found', 'We could not find that subscription.', 404)

      const ownerId = (recipient.mails as unknown as { owner_id: string } | null)?.owner_id
      if (ownerId) {
        // Suppression is per account, not per campaign: opting out of one email
        // has to stop the next one too, or the unsubscribe is theatre.
        await admin.from('suppressions').upsert(
          {
            owner_id: ownerId,
            email: recipient.email.toLowerCase(),
            reason: 'unsubscribe',
            source_mail_id: mailId,
          },
          { onConflict: 'owner_id,email', ignoreDuplicates: true },
        )
      }

      await admin.from('mail_events').insert({
        mail_id: mailId,
        recipient_id: recipientId,
        type: 'unsubscribe',
        ...clientMeta(req),
      })

      return htmlPage(
        'You are unsubscribed',
        `${recipient.email} will not receive further emails from this sender.`,
      )
    }

    default:
      return htmlPage('Not found', 'Unknown tracking action.', 404)
  }
})
