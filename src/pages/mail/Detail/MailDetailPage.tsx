import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Copy, Send, Users, MailCheck, Eye, MousePointerClick, AlertCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectCurrentMail, selectIsLoadingCurrent } from '@domains/mail/store/mail.selectors'
import StatusBadge from '@shared/components/StatusBadge'
import { formatDateTime, formatNumber, formatPercent } from '@shared/utils/format'
import DocumentPreview from '@pages/mail/Composer/components/Preview/DocumentPreview'
import { createMail } from '@domains/mail/factories'
import { cx } from '@shared/utils/cx'

export default function MailDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const mail = useAppSelector(selectCurrentMail)
  const isLoading = useAppSelector(selectIsLoadingCurrent)

  useEffect(() => {
    if (id && mail?.id !== id) dispatch(mailActions.fetchByIdRequest(id))
  }, [id, mail, dispatch])

  if (isLoading || !mail || mail.id !== id) {
    return <div className="p-12 text-center text-sm text-ink-500">Loading…</div>
  }

  const onDelete = () => {
    if (window.confirm(`Delete "${mail.title}"?`)) {
      dispatch(mailActions.deleteRequest(mail.id))
      navigate('/mail')
    }
  }

  const onDuplicate = () => {
    const dup = createMail({
      title: `${mail.title} (copy)`,
      status: 'draft',
      subject: mail.subject,
      preheader: mail.preheader,
      senderName: mail.senderName,
      senderEmail: mail.senderEmail,
      replyToEmail: mail.replyToEmail,
      document: mail.document,
    })
    dispatch(mailActions.createRequest(dup))
    navigate('/mail')
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/mail')} className="btn-ghost -ml-2">
            <ArrowLeft size={14} /> Back to emails
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onDuplicate} className="btn-outline">
              <Copy size={14} /> Duplicate
            </button>
            <button
              onClick={onDelete}
              className="btn-outline !text-red-600 hover:!bg-red-50 hover:!border-red-200"
            >
              <Trash2 size={14} /> Delete
            </button>
            {mail.status === 'draft' && (
              <button onClick={() => navigate(`/mail/${mail.id}/edit`)} className="btn-primary">
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>
        </div>

        <header className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={mail.status} />
            <span className="text-xs text-ink-500 inline-flex items-center gap-1">
              {mail.status === 'sent' && mail.sentAt && (
                <>
                  <Send size={11} /> Sent {formatDateTime(mail.sentAt)}
                </>
              )}
              {mail.status === 'scheduled' && mail.scheduledAt && (
                <>Scheduled for {formatDateTime(mail.scheduledAt)}</>
              )}
              {mail.status === 'draft' && <>Last edited {formatDateTime(mail.updatedAt)}</>}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-display mb-2">
            {mail.title}
          </h1>
          {mail.subject && (
            <p className="text-ink-600 text-sm">
              <span className="text-ink-400">Subject —</span> {mail.subject}
            </p>
          )}
        </header>

        {mail.stats && (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
            <Stat
              icon={<Users size={14} />}
              accent="tile-text"
              label="Recipients"
              value={formatNumber(mail.stats.recipientCount)}
            />
            <Stat
              icon={<MailCheck size={14} />}
              accent="tile-divider"
              label="Delivered"
              value={formatNumber(mail.stats.deliveredCount)}
            />
            <Stat
              icon={<Eye size={14} />}
              accent="tile-button"
              label="Open rate"
              value={formatPercent(mail.stats.openCount, mail.stats.deliveredCount)}
              sub={`${formatNumber(mail.stats.openCount)} opens`}
            />
            <Stat
              icon={<MousePointerClick size={14} />}
              accent="tile-image"
              label="Click rate"
              value={formatPercent(mail.stats.clickCount, mail.stats.deliveredCount)}
              sub={`${formatNumber(mail.stats.clickCount)} clicks`}
            />
            <Stat
              icon={<AlertCircle size={14} />}
              accent="tile-spacer"
              label="Unsubscribes"
              value={formatNumber(mail.stats.unsubscribeCount)}
            />
          </section>
        )}

        <section className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold tracking-display">Preview</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                What recipients see when they open this email.
              </p>
            </div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-400">
              Read-only
            </span>
          </div>
          <div className="bg-surface-inset p-8 rounded-xl flex justify-center border border-ink-100">
            <DocumentPreview document={mail.document} className="shadow-card rounded-md" />
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({
  icon,
  accent,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  accent: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={cx('tile w-6 h-6', accent)}>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-500">
          {label}
        </span>
      </div>
      <div className="font-display text-2xl font-bold text-ink-900">{value}</div>
      {sub && <div className="text-xs text-ink-500 mt-0.5">{sub}</div>}
    </div>
  )
}
