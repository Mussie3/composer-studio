-- Composer Studio :: extensions and shared helpers
--
-- Supabase ships most of these pre-installed; `if not exists` keeps the
-- migration idempotent against a fresh local stack and a hosted project alike.

create extension if not exists pgcrypto with schema extensions;

-- pg_net + pg_cron are used by the scheduled-send dispatcher (see 20260907090700).
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Trigger helper: stamps updated_at on every UPDATE.';
