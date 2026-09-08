-- Composer Studio :: read API
--
-- The frontend's Mail type is camelCase with nested recipients and stats.
-- Rather than stitch three PostgREST calls together in the browser (and rather
-- than rely on PostgREST inferring an embed relationship through a view, which
-- is fragile), these functions return the exact shape the client already parses.

-- ---------------------------------------------------------------------------
-- The database carries two states the UI has no concept of:
--   sending -> the dispatcher has claimed it; from the user's point of view it
--              is still on its way, so it reads as 'scheduled'
--   failed  -> it needs attention and is editable again, so it reads as 'draft'
-- send_error is passed through alongside so the UI can surface the reason.
-- ---------------------------------------------------------------------------
create or replace function public.ui_status(s public.mail_status)
returns text
language sql
immutable
as $$
  select case s
    when 'sending' then 'scheduled'
    when 'failed'  then 'draft'
    else s::text
  end;
$$;

create or replace function public.mail_json(m public.mails, p_with_recipients boolean)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'id',             m.id,
    'title',          m.title,
    'status',         public.ui_status(m.status),
    'subject',        m.subject,
    'preheader',      m.preheader,
    'senderName',     m.sender_name,
    'senderEmail',    m.sender_email,
    'replyToEmail',   m.reply_to_email,
    'document',       m.document,
    'templateId',     m.template_id,
    'createdAt',      m.created_at,
    'updatedAt',      m.updated_at,
    'scheduledAt',    m.scheduled_at,
    'sentAt',         m.sent_at,
    'sendError',      m.send_error,
    'rawStatus',      m.status,
    'recipients',
      case when p_with_recipients then coalesce(
        (select jsonb_agg(jsonb_build_object('email', r.email, 'fields', r.fields) order by r.created_at)
         from public.mail_recipients r where r.mail_id = m.id),
        '[]'::jsonb)
      else '[]'::jsonb end,
    -- stats is null until a mail has actually gone out, matching the frontend's
    -- `stats: MailStats | null` and letting the UI branch on "was this sent".
    'stats',
      case when m.status <> 'sent' then null else (
        select jsonb_build_object(
          'recipientCount',    s.recipient_count,
          'deliveredCount',    s.delivered_count,
          'openCount',         s.open_count,
          'clickCount',        s.click_count,
          'unsubscribeCount',  s.unsubscribe_count,
          'bounceCount',       s.bounce_count
        )
        from public.mail_stats s where s.mail_id = m.id
      ) end
  );
$$;

-- List: recipients deliberately omitted. A campaign can carry 50k addresses and
-- the list page only ever shows counts (which come from stats).
create or replace function public.list_mails()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    jsonb_agg(public.mail_json(m, false) order by m.updated_at desc),
    '[]'::jsonb
  )
  from public.mails m
  where m.owner_id = (select auth.uid());
$$;

create or replace function public.get_mail(p_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select public.mail_json(m, true)
  from public.mails m
  where m.id = p_id;
$$;
