-- Composer Studio :: scheduled sends
--
-- "Schedule for later" only means something if something wakes up later. pg_cron
-- ticks every minute and pokes the dispatch-scheduled Edge Function over pg_net.

-- ---------------------------------------------------------------------------
-- Atomic claim.
--
-- FOR UPDATE SKIP LOCKED is the point of this function: two overlapping cron
-- ticks (or a retry after a timeout) can both run this, and each will get a
-- disjoint set of mails. Flipping status to 'sending' inside the same
-- transaction means a claimed mail is invisible to the next tick even after the
-- lock is released -- which is what stops a campaign going out twice.
-- ---------------------------------------------------------------------------
create or replace function public.claim_due_mails(p_limit integer default 10)
returns setof public.mails
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select m.id
    from public.mails m
    where m.status = 'scheduled'
      and m.scheduled_at <= now()
    order by m.scheduled_at
    limit p_limit
    for update skip locked
  )
  update public.mails m
     set status = 'sending'
    from due
   where m.id = due.id
  returning m.*;
end;
$$;

revoke all on function public.claim_due_mails(integer) from public, anon, authenticated;

comment on function public.claim_due_mails is
  'Atomically claims due scheduled mails and marks them sending. Service role only.';

-- ---------------------------------------------------------------------------
-- The cron tick.
--
-- Both secrets must exist in Vault before this job can do anything. Create them
-- once per project (see supabase/README.md):
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>',        'service_role_key');
-- ---------------------------------------------------------------------------
select cron.unschedule('composer-dispatch-scheduled')
where exists (select 1 from cron.job where jobname = 'composer-dispatch-scheduled');

select cron.schedule(
  'composer-dispatch-scheduled',
  '* * * * *',
  $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/dispatch-scheduled',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $cron$
);
