-- Composer Studio :: engagement events + derived stats
--
-- MailStats in the frontend is not stored -- it is derived. Every number on the
-- Detail page and the Usage dashboard is an aggregate over immutable event rows,
-- so a stat can never drift from the events that produced it. This is the same
-- "derive what you can derive" principle SignalScope uses for service status.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'mail_event_type') then
    create type public.mail_event_type as enum (
      'delivered', 'open', 'click', 'unsubscribe', 'bounce', 'complaint'
    );
  end if;
end
$$;

create table if not exists public.mail_events (
  id           bigint generated always as identity primary key,
  mail_id      uuid not null references public.mails (id) on delete cascade,
  recipient_id uuid references public.mail_recipients (id) on delete set null,
  type         public.mail_event_type not null,
  url          text,        -- click target
  user_agent   text,
  ip           inet,
  created_at   timestamptz not null default now()
);

create index if not exists mail_events_mail_type_idx
  on public.mail_events (mail_id, type);

create index if not exists mail_events_created_idx
  on public.mail_events (created_at desc);

-- Supports the "unique opens / unique clicks" aggregate below.
create index if not exists mail_events_recipient_idx
  on public.mail_events (mail_id, type, recipient_id);

alter table public.mail_events enable row level security;

-- Read-only to the owner. Writes come from the track function under the service
-- role: an open pixel is fired by an anonymous email client, so it cannot carry
-- a user JWT, and letting anon INSERT directly would let anyone forge stats.
drop policy if exists mail_events_select_own on public.mail_events;
create policy mail_events_select_own on public.mail_events
  for select to authenticated
  using (public.owns_mail(mail_id));

-- ---------------------------------------------------------------------------
-- mail_stats -- exactly the MailStats shape the frontend expects.
--
-- Opens and clicks are counted as UNIQUE RECIPIENTS, not raw hits. A raw count
-- inflates with every image reload and every proxy prefetch; unique opens is
-- what an open *rate* is supposed to divide by.
-- ---------------------------------------------------------------------------
create or replace view public.mail_stats
with (security_invoker = on) as
select
  m.id as mail_id,
  m.owner_id,
  (select count(*) from public.mail_recipients r where r.mail_id = m.id)              as recipient_count,
  (select count(*) from public.mail_deliveries d
     where d.mail_id = m.id and d.status in ('sent', 'delivered'))                     as delivered_count,
  (select count(distinct e.recipient_id) from public.mail_events e
     where e.mail_id = m.id and e.type = 'open')                                      as open_count,
  (select count(distinct e.recipient_id) from public.mail_events e
     where e.mail_id = m.id and e.type = 'click')                                     as click_count,
  (select count(distinct e.recipient_id) from public.mail_events e
     where e.mail_id = m.id and e.type = 'unsubscribe')                               as unsubscribe_count,
  (select count(distinct e.recipient_id) from public.mail_events e
     where e.mail_id = m.id and e.type in ('bounce', 'complaint'))                     as bounce_count
from public.mails m;

comment on view public.mail_stats is
  'Derived MailStats per mail. Opens/clicks are unique recipients, not raw hits.';

-- ---------------------------------------------------------------------------
-- usage_overview -- the header numbers on /mail/usage.
-- ---------------------------------------------------------------------------
create or replace view public.usage_overview
with (security_invoker = on) as
select
  m.owner_id,
  count(*) filter (where m.status = 'sent')                     as campaign_count,
  coalesce(sum(s.recipient_count), 0)                           as recipient_total,
  coalesce(sum(s.delivered_count), 0)                           as delivered_total,
  coalesce(sum(s.open_count), 0)                                as open_total,
  coalesce(sum(s.click_count), 0)                               as click_total,
  coalesce(sum(s.unsubscribe_count), 0)                         as unsubscribe_total,
  coalesce(sum(s.bounce_count), 0)                              as bounce_total,
  -- Rates divide by delivered, not by recipients: an address that bounced was
  -- never given the chance to open, so counting it drags the rate down for a
  -- reason that has nothing to do with the content.
  case when coalesce(sum(s.delivered_count), 0) = 0 then 0
       else round(sum(s.open_count)::numeric  / sum(s.delivered_count), 4) end as avg_open_rate,
  case when coalesce(sum(s.delivered_count), 0) = 0 then 0
       else round(sum(s.click_count)::numeric / sum(s.delivered_count), 4) end as avg_click_rate
from public.mails m
join public.mail_stats s on s.mail_id = m.id
where m.status = 'sent'
group by m.owner_id;

-- ---------------------------------------------------------------------------
-- usage_daily_sends -- the 30-day line chart. Generated from a date series so
-- days with zero sends still appear; otherwise the chart silently compresses
-- quiet periods and misrepresents the trend.
-- ---------------------------------------------------------------------------
create or replace function public.usage_daily_sends(p_days integer default 30)
returns table (day date, mails_sent bigint, recipients bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d.day::date,
    count(m.id)                            as mails_sent,
    coalesce(sum(s.recipient_count), 0)::bigint as recipients
  from generate_series(
         (current_date - (p_days - 1)),
         current_date,
         interval '1 day'
       ) as d(day)
  left join public.mails m
    on m.owner_id = (select auth.uid())
   and m.status = 'sent'
   and m.sent_at::date = d.day::date
  left join public.mail_stats s on s.mail_id = m.id
  group by d.day
  order by d.day;
$$;
