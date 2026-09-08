-- Composer Studio :: sender + business profiles
--
-- Mirrors SenderProfile / BusinessProfile in src/domains/mail/types.ts.
-- One row per auth user; the frontend Settings page reads and writes these
-- through GET/PUT /sender and /business, which become single-row upserts here.

-- ---------------------------------------------------------------------------
-- sender_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.sender_profiles (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  sender_name     text        not null default '',
  sender_email    text        not null default '',
  reply_to_email  text        not null default '',
  -- Verification is a real gate: send-mail refuses to dispatch from an
  -- unverified sender. Only the service role may flip it (see policies below),
  -- so a client cannot mark itself verified.
  is_verified     boolean     not null default false,
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint sender_email_shape
    check (sender_email = '' or sender_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint reply_to_email_shape
    check (reply_to_email = '' or reply_to_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

drop trigger if exists sender_profiles_updated_at on public.sender_profiles;
create trigger sender_profiles_updated_at
  before update on public.sender_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- business_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.business_profiles (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  business_name     text        not null default '',
  business_address  text        not null default '',
  website_url       text        not null default '',
  logo_url          text        not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists business_profiles_updated_at on public.business_profiles;
create trigger business_profiles_updated_at
  before update on public.business_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Provision both rows the moment a user signs up, so the Settings page always
-- has something to read and never has to branch on "profile missing".
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sender_profiles (user_id, sender_name, sender_email, reply_to_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.email, '')
  )
  on conflict (user_id) do nothing;

  insert into public.business_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS: a user sees and edits exactly one row -- their own.
-- ---------------------------------------------------------------------------
alter table public.sender_profiles   enable row level security;
alter table public.business_profiles enable row level security;

drop policy if exists sender_profiles_select_own on public.sender_profiles;
create policy sender_profiles_select_own on public.sender_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists sender_profiles_insert_own on public.sender_profiles;
create policy sender_profiles_insert_own on public.sender_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists sender_profiles_update_own on public.sender_profiles;
create policy sender_profiles_update_own on public.sender_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Verification is not the client's to grant, but it cannot be enforced in the
-- policy above: a WITH CHECK that reads sender_profiles to compare against the
-- old value recurses into the very policy being evaluated, and Postgres aborts
-- the whole UPDATE -- including the legitimate ones.
--
-- A BEFORE trigger sees OLD and NEW directly, so it can pin the column without
-- reading the table at all. Only the 'authenticated' role is pinned; the
-- service role (and any verification webhook running under it) passes through.
create or replace function public.protect_sender_verification()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'authenticated' then
    new.is_verified := old.is_verified;
    new.verified_at := old.verified_at;
  end if;
  return new;
end;
$$;

drop trigger if exists sender_profiles_protect_verification on public.sender_profiles;
create trigger sender_profiles_protect_verification
  before update on public.sender_profiles
  for each row execute function public.protect_sender_verification();

drop policy if exists business_profiles_select_own on public.business_profiles;
create policy business_profiles_select_own on public.business_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists business_profiles_insert_own on public.business_profiles;
create policy business_profiles_insert_own on public.business_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists business_profiles_update_own on public.business_profiles;
create policy business_profiles_update_own on public.business_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
