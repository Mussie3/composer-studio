-- Composer Studio :: recipients, deliveries, suppressions
--
-- Recipients live in their own table rather than as jsonb on the mail. A CSV
-- import can be tens of thousands of rows, each one needs its own delivery
-- record and per-recipient open/click attribution, and the Send modal dedups by
-- address -- all of which the database does better than a jsonb array.

create table if not exists public.mail_recipients (
  id         uuid primary key default gen_random_uuid(),
  mail_id    uuid not null references public.mails (id) on delete cascade,
  email      text not null,
  -- Personalization values keyed by token name: firstName, lastName, ...
  -- (see src/domains/mail/tokens.ts). Anything not present falls back to '' at
  -- substitution time so a raw {{firstName}} never ships to an inbox.
  fields     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint recipient_email_shape
    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Addresses are stored already normalised. Enforcing that here rather than
  -- indexing lower(email) keeps the uniqueness a plain column constraint, which
  -- is what PostgREST needs to resolve an upsert's on_conflict target.
  constraint recipient_email_normalised
    check (email = lower(email)),
  constraint recipient_fields_is_object
    check (jsonb_typeof(fields) = 'object'),

  -- Dedup is therefore case-insensitive in effect: alex@x.com and Alex@X.com
  -- normalise to one row.
  unique (mail_id, email)
);

create index if not exists mail_recipients_mail_idx
  on public.mail_recipients (mail_id);

-- ---------------------------------------------------------------------------
-- Deliveries: one row per (mail, recipient) attempt.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type public.delivery_status as enum (
      'queued', 'sent', 'delivered', 'bounced', 'failed', 'suppressed'
    );
  end if;
end
$$;

create table if not exists public.mail_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  mail_id             uuid not null references public.mails (id) on delete cascade,
  recipient_id        uuid not null references public.mail_recipients (id) on delete cascade,
  status              public.delivery_status not null default 'queued',
  provider            text,
  provider_message_id text,
  error               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- A recipient is attempted once per mail. Re-running the dispatcher after a
  -- crash therefore cannot double-send: the insert conflicts and is skipped.
  unique (mail_id, recipient_id)
);

create index if not exists mail_deliveries_mail_idx
  on public.mail_deliveries (mail_id, status);

create index if not exists mail_deliveries_provider_msg_idx
  on public.mail_deliveries (provider_message_id)
  where provider_message_id is not null;

drop trigger if exists mail_deliveries_updated_at on public.mail_deliveries;
create trigger mail_deliveries_updated_at
  before update on public.mail_deliveries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Suppressions: an unsubscribe or hard bounce is permanent and applies across
-- every future mail this account sends, not just the one that triggered it.
-- ---------------------------------------------------------------------------
create table if not exists public.suppressions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  email      text not null,
  reason     text not null default 'unsubscribe',
  source_mail_id uuid references public.mails (id) on delete set null,
  created_at timestamptz not null default now(),

  constraint suppression_email_normalised check (email = lower(email)),
  unique (owner_id, email)
);

-- ---------------------------------------------------------------------------
-- RLS -- everything hangs off ownership of the parent mail.
-- ---------------------------------------------------------------------------
alter table public.mail_recipients enable row level security;
alter table public.mail_deliveries enable row level security;
alter table public.suppressions    enable row level security;

create or replace function public.owns_mail(p_mail_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.mails m
    where m.id = p_mail_id and m.owner_id = (select auth.uid())
  );
$$;

drop policy if exists mail_recipients_rw_own on public.mail_recipients;
create policy mail_recipients_rw_own on public.mail_recipients
  for all to authenticated
  using (public.owns_mail(mail_id))
  with check (public.owns_mail(mail_id));

-- Deliveries are written only by the send pipeline (service role, which bypasses
-- RLS). Clients get read access so the Detail page can show per-recipient state.
drop policy if exists mail_deliveries_select_own on public.mail_deliveries;
create policy mail_deliveries_select_own on public.mail_deliveries
  for select to authenticated
  using (public.owns_mail(mail_id));

drop policy if exists suppressions_select_own on public.suppressions;
create policy suppressions_select_own on public.suppressions
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists suppressions_insert_own on public.suppressions;
create policy suppressions_insert_own on public.suppressions
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists suppressions_delete_own on public.suppressions;
create policy suppressions_delete_own on public.suppressions
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Bulk recipient replace: the Send modal hands over the whole parsed CSV at
-- once. Doing this as one RPC means one round trip and one transaction, instead
-- of N inserts from the browser.
-- ---------------------------------------------------------------------------
create or replace function public.replace_recipients(
  p_mail_id uuid,
  p_recipients jsonb  -- [{ "email": "...", "fields": { ... } }, ...]
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  inserted integer;
begin
  if not public.owns_mail(p_mail_id) then
    raise exception 'mail % not found', p_mail_id using errcode = 'no_data_found';
  end if;

  delete from public.mail_recipients where mail_id = p_mail_id;

  insert into public.mail_recipients (mail_id, email, fields)
  select
    p_mail_id,
    lower(trim(r ->> 'email')),
    coalesce(r -> 'fields', '{}'::jsonb)
  from jsonb_array_elements(p_recipients) as r
  where trim(coalesce(r ->> 'email', '')) ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  on conflict (mail_id, email) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;
