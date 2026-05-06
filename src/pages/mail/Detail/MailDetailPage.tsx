import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Copy, Send } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectCurrentMail, selectIsLoadingCurrent } from '@domains/mail/store/mail.selectors'
import StatusBadge from '@shared/components/StatusBadge'
import { formatDateTime, formatNumber, formatPercent } from '@shared/utils/format'
import DocumentPreview from '@pages/mail/Composer/components/Preview/DocumentPreview'
import { createMail } from '@domains/mail/factories'

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
    return <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
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
    <div className="h-full overflow-auto bg-canvas">
      <div className="max-w-5xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/mail')} className="btn-ghost -ml-2">
            <ArrowLeft size={14} /> Back to emails
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onDuplicate} className="btn-outline">
              <Copy size={14} /> Duplicate
            </button>
            <button onClick={onDelete} className="btn-outline text-red-600 hover:bg-red-50">
              <Trash2 size={14} /> Delete
            </button>
            {mail.status === 'draft' && (
              <button
                onClick={() => navigate(`/mail/${mail.id}/edit`)}
                className="btn-primary"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
            {mail.status === 'draft' && (
              <button className="btn-primary" disabled>
                <Send size={14} /> Send (coming soon)
              </button>
            )}
          </div>
        </div>

        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={mail.status} />
            <span className="text-xs text-gray-500">
              {mail.status === 'sent' && mail.sentAt && `Sent ${formatDateTime(mail.sentAt)}`}
              {mail.status === 'scheduled' && mail.scheduledAt && `Scheduled for ${formatDateTime(mail.scheduledAt)}`}
              {mail.status === 'draft' && `Last edited ${formatDateTime(mail.updatedAt)}`}
            </span>
          </div>
          <h1 className="text-2xl font-semibold mb-1">{mail.title}</h1>
          {mail.subject && <p className="text-gray-600">Subject: {mail.subject}</p>}
        </header>

        {mail.stats && (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Stat label="Recipients" value={formatNumber(mail.stats.recipientCount)} />
            <Stat label="Delivered" value={formatNumber(mail.stats.deliveredCount)} />
            <Stat
              label="Open rate"
              value={formatPercent(mail.stats.openCount, mail.stats.deliveredCount)}
              sub={`${formatNumber(mail.stats.openCount)} opens`}
            />
            <Stat
              label="Click rate"
              value={formatPercent(mail.stats.clickCount, mail.stats.deliveredCount)}
              sub={`${formatNumber(mail.stats.clickCount)} clicks`}
            />
            <Stat label="Unsubscribes" value={formatNumber(mail.stats.unsubscribeCount)} />
          </section>
        )}

        <section className="panel p-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Preview
          </div>
          <div className="bg-canvas p-6 rounded-md flex justify-center">
            <DocumentPreview document={mail.document} className="shadow-sm" />
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}
