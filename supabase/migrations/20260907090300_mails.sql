-- Composer Studio :: mails
--
-- The composer document is a deeply nested tree (blocks -> cells -> elements,
-- a discriminated union). It is stored whole as jsonb rather than shredded into
-- relational tables: nothing server-side queries *inside* the tree, the client
-- already owns the schema in TypeScript, and keeping it atomic makes autosave a
-- single-row write instead of a diff across four tables.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'mail_status') then
    create type public.mail_status as enum (
      'draft',
      'scheduled',
      'sending',   -- claimed by the dispatcher, fan-out in progress
      'sent',
      'failed'
    );
  end if;
end
$$;

create table if not exists public.mails (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,

  title           text not null default 'Untitled',
  status          public.mail_status not null default 'draft',

  subject         text not null default '',
  preheader       text not null default '',

  -- Sender identity is snapshotted onto the mail at compose time so editing
  -- Settings later never rewrites the history of what was already sent.
  sender_name     text not null default '',
  sender_email    text not null default '',
  reply_to_email  text not null default '',

  document        jsonb not null,
  template_id     text,

  -- HTML snapshot taken from the client's own generator at send/schedule time.
  -- The generator (src/domains/mail/html/generate.ts) stays the single source of
  -- truth for markup; the backend only substitutes tokens and rewrites links
  -- into it per recipient. No second renderer to keep in sync.
  rendered_html   text,

  scheduled_at    timestamptz,
  sent_at         timestamptz,
  send_error      text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Shape guard: cheap, and it catches a client that posts a half-built doc.
  constraint document_shape check (
    jsonb_typeof(document -> 'blocks') = 'array'
    and jsonb_typeof(document -> 'footer') = 'object'
    and jsonb_typeof(document -> 'styles') = 'object'
  ),
  constraint scheduled_needs_time check (
    status <> 'scheduled' or scheduled_at is not null
  ),
  constraint sent_needs_time check (
    status <> 'sent' or sent_at is not null
  )
);

-- The list page is "my mails, newest activity first", optionally filtered by
-- status. One composite index serves both.
create index if not exists mails_owner_updated_idx
  on public.mails (owner_id, updated_at desc);

create index if not exists mails_owner_status_idx
  on public.mails (owner_id, status);

-- Partial index for the dispatcher's hot query: due scheduled mails only.
create index if not exists mails_due_idx
  on public.mails (scheduled_at)
  where status = 'scheduled';

create index if not exists mails_title_search_idx
  on public.mails using gin (to_tsvector('simple', title));

drop trigger if exists mails_updated_at on public.mails;
create trigger mails_updated_at
  before update on public.mails
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.mails enable row level security;

drop policy if exists mails_select_own on public.mails;
create policy mails_select_own on public.mails
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists mails_insert_own on public.mails;
create policy mails_insert_own on public.mails
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

-- Clients may edit content freely but may not declare a mail sent: status
-- transitions into 'sending'/'sent'/'failed' belong to the send-mail function
-- running as the service role. 'scheduled' is allowed so the Send modal can
-- schedule without a round trip, and the dispatcher takes it from there.
drop policy if exists mails_update_own on public.mails;
create policy mails_update_own on public.mails
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and status in ('draft', 'scheduled')
  );

drop policy if exists mails_delete_own on public.mails;
create policy mails_delete_own on public.mails
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Duplicate: the Detail page's "duplicate" action, done server-side so the
-- whole document tree never round-trips through the browser.
-- ---------------------------------------------------------------------------
create or replace function public.duplicate_mail(p_mail_id uuid)
returns public.mails
language plpgsql
security invoker
set search_path = public
as $$
declare
  copy public.mails;
begin
  insert into public.mails (
    owner_id, title, status, subject, preheader,
    sender_name, sender_email, reply_to_email, document, template_id
  )
  select
    owner_id, title || ' (copy)', 'draft', subject, preheader,
    sender_name, sender_email, reply_to_email, document, template_id
  from public.mails
  where id = p_mail_id
  returning * into copy;

  if copy.id is null then
    raise exception 'mail % not found or not visible', p_mail_id
      using errcode = 'no_data_found';
  end if;

  return copy;
end;
$$;

comment on function public.duplicate_mail is
  'Clones a mail (and its document) back to draft status. SECURITY INVOKER, so RLS decides what is visible and insertable.';
