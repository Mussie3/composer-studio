# Composer Studio — backend

Supabase-native: Postgres + RLS for data, Edge Functions for the parts that talk
to the outside world, pg_cron for scheduled sends. There is no separate server
to host.

## What lives where

| Piece | Where | Why |
|---|---|---|
| Mails, recipients, deliveries, events | Postgres | |
| The composer document | `mails.document` jsonb | Nothing server-side queries inside the tree, and autosave stays one row write |
| Access control | RLS on every table | Ownership is enforced by the database, not by remembering to write an `if` |
| Stats | Views over event rows | Derived, so a number can never drift from the events behind it |
| Images | Storage, public bucket | Mail clients fetch images anonymously; a signed URL would expire in the inbox |
| Sending, scheduling, tracking | Edge Functions | The only work that needs a network call or a secret |
| Scheduled dispatch | pg_cron → pg_net → Edge Function | "Send later" needs something that wakes up later |

Email delivery is the one thing Supabase cannot do itself. It sits behind a
one-method interface in `functions/_shared/email/`, with Resend implemented and
a console provider as the default so the whole pipeline runs with no API key.

## Migrations

Applied in filename order.

| File | Contents |
|---|---|
| `…090100_extensions.sql` | pgcrypto, pg_net, pg_cron, `set_updated_at()` |
| `…090200_profiles.sql` | Sender + business profiles, signup trigger, verification guard |
| `…090300_mails.sql` | `mails`, status enum, RLS, `duplicate_mail()` |
| `…090400_recipients.sql` | Recipients, deliveries, suppressions, `replace_recipients()` |
| `…090500_events_and_stats.sql` | `mail_events`, `mail_stats`, `usage_overview`, `usage_daily_sends()` |
| `…090600_api.sql` | `list_mails()` / `get_mail()` returning the frontend's exact `Mail` shape |
| `…090700_storage.sql` | Public `composer-assets` bucket, owner-scoped write policies |
| `…090800_scheduling.sql` | `claim_due_mails()` + the cron tick |
| `…090900_grants.sql` | Explicit privileges; `anon` gets nothing |

## Local

```sh
npx supabase start          # needs Docker running
npx supabase db reset       # applies migrations + seed.sql
```

`seed.sql` creates `demo@composer.studio` / `composer123`.

Point the app at it:

```sh
cp .env.example .env.local        # from the repo root
# fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from `supabase start` output
npm run dev
```

`VITE_BACKEND=mock` (the default) keeps the original localStorage backend, so a
fresh clone still runs with no setup.

## Deploying

```sh
npx supabase link --project-ref <your-project-ref>
npx supabase db push
npx supabase functions deploy send-mail dispatch-scheduled track
```

Function secrets:

```sh
npx supabase secrets set \
  TRACKING_SECRET="$(openssl rand -hex 32)" \
  EMAIL_PROVIDER=resend \
  RESEND_API_KEY=re_xxx \
  REQUIRE_VERIFIED_SENDER=true \
  ALLOWED_ORIGIN=https://your-app.example.com
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
by the platform — do not set them yourself.

Then, once per project, so pg_cron can call the dispatcher (run in the SQL
editor):

```sql
select vault.create_secret('https://<ref>.supabase.co', 'project_url');
select vault.create_secret('<service-role-key>',        'service_role_key');
```

`TRACKING_SECRET` signs every open/click/unsubscribe link. Rotating it
invalidates links already sitting in inboxes, so rotate deliberately.

## How a send actually goes out

1. The client renders the document with its own `generateHtml()` and posts the
   HTML to `send-mail`. The client generator stays the only renderer in the
   codebase — the backend never rebuilds the document.
2. `send-mail` validates (subject, sender, at least one recipient), snapshots
   the HTML onto the mail, and flips it to `sending`.
3. Deliveries are queued — one row per recipient, suppressed addresses marked
   as such.
4. The queue is drained in provider-sized batches. Each message gets token
   substitution, links rewritten through `/track/click`, an open pixel, and a
   signed unsubscribe URL.
5. Whatever the drain does not reach stays `queued`; the next cron tick takes
   another slice. The mail leaves `sending` only when the queue is empty.

That split is why a 50,000-address campaign survives an Edge Function timeout,
and why `(mail_id, recipient_id)` being unique means a retry cannot double-send.

## Scheduling

Scheduling stores the HTML snapshot immediately. Editing the document afterwards
does **not** change what goes out — a scheduled campaign is frozen at the moment
it was scheduled.

## Things worth knowing

- `is_verified` cannot be set by a client. A `BEFORE UPDATE` trigger pins it;
  the equivalent RLS `WITH CHECK` would recurse into its own policy and break
  every legitimate profile edit.
- Opens and clicks count **unique recipients**, not raw hits — a raw count
  inflates with every image reload and proxy prefetch.
- Rates divide by *delivered*, not by recipients: a bounced address never had
  the chance to open.
- Unsubscribes are per account, not per campaign.
- The `track` function runs with `verify_jwt = false`, because mail clients
  cannot present a JWT. Its authentication is the HMAC on the link.
