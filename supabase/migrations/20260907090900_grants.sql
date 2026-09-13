-- Composer Studio :: explicit privileges
--
-- A hosted Supabase project sets default privileges that hand anon and
-- authenticated full table access, leaving RLS as the only thing standing
-- between an anonymous request and the data. RLS is written and tested here, so
-- that would hold -- but "one correct policy away from a public database" is a
-- bad place to stand. These grants say plainly which role may attempt what, and
-- RLS then decides which rows.
--
-- anon gets nothing. Nothing in this app is readable without a session.

revoke all on all tables in schema public from anon;
revoke all on all routines in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on routines from anon;

grant usage on schema public to authenticated;

-- Content the user owns and edits.
grant select, insert, update, delete on public.mails            to authenticated;
grant select, insert, update, delete on public.mail_recipients  to authenticated;
grant select, insert, delete         on public.suppressions     to authenticated;
grant select, insert, update         on public.sender_profiles  to authenticated;
grant select, insert, update         on public.business_profiles to authenticated;

-- Written by the send pipeline and the tracker under the service role; the user
-- only ever reads them.
grant select on public.mail_deliveries to authenticated;
grant select on public.mail_events     to authenticated;
grant select on public.mail_stats      to authenticated;
grant select on public.usage_overview  to authenticated;

grant execute on function public.list_mails()                        to authenticated;
grant execute on function public.get_mail(uuid)                      to authenticated;
grant execute on function public.mail_json(public.mails, boolean)    to authenticated;
grant execute on function public.ui_status(public.mail_status)       to authenticated;
grant execute on function public.duplicate_mail(uuid)                to authenticated;
grant execute on function public.replace_recipients(uuid, jsonb)     to authenticated;
grant execute on function public.owns_mail(uuid)                     to authenticated;
grant execute on function public.usage_daily_sends(integer)          to authenticated;
