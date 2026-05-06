import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Mail as MailIcon, Trash2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectIsLoadingList, selectMails } from '@domains/mail/store/mail.selectors'
import StatusBadge from '@shared/components/StatusBadge'
import { formatPercent, formatRelative } from '@shared/utils/format'
import { cx } from '@shared/utils/cx'
import type { Mail, MailStatus } from '@domains/mail/types'

const FILTERS: { value: 'all' | MailStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sent', label: 'Sent' },
]

export default function MailListPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const mails = useAppSelector(selectMails)
  const isLoading = useAppSelector(selectIsLoadingList)
  const [filter, setFilter] = useState<'all' | MailStatus>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    dispatch(mailActions.fetchListRequest())
  }, [dispatch])

  const visible = useMemo(() => {
    return mails
      .filter((m) => (filter === 'all' ? true : m.status === filter))
      .filter((m) => (query ? m.title.toLowerCase().includes(query.toLowerCase()) : true))
      .slice()
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [mails, filter, query])

  const counts = useMemo(() => {
    const all = mails.length
    const draft = mails.filter((m) => m.status === 'draft').length
    const scheduled = mails.filter((m) => m.status === 'scheduled').length
    const sent = mails.filter((m) => m.status === 'sent').length
    return { all, draft, scheduled, sent }
  }, [mails])

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Emails</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Drafts, scheduled, and sent. {mails.length} total.
            </p>
          </div>
          <Link to="/mail/new" className="btn-primary">
            <Plus size={16} />
            New email
          </Link>
        </header>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex border border-canvas-border rounded-md overflow-hidden bg-canvas-panel">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cx(
                  'px-3 py-1.5 text-sm transition',
                  filter === f.value ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                {f.label}
                <span className="ml-2 text-xs text-gray-400">
                  {f.value === 'all' ? counts.all : counts[f.value]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title..."
              className="input pl-9 w-72"
            />
          </div>
        </div>

        <div className="panel overflow-hidden">
          {isLoading && mails.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="p-12 text-center">
              <MailIcon size={32} className="mx-auto text-gray-300 mb-2" />
              <div className="text-sm text-gray-500">
                {query ? 'No emails match your search.' : 'No emails yet.'}
              </div>
              {!query && (
                <button onClick={() => navigate('/mail/new')} className="btn-primary mt-4">
                  <Plus size={14} /> Create your first email
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium w-28">Status</th>
                  <th className="text-left px-4 py-3 font-medium w-32">Recipients</th>
                  <th className="text-left px-4 py-3 font-medium w-28">Open rate</th>
                  <th className="text-left px-4 py-3 font-medium w-36">Updated</th>
                  <th className="text-right px-4 py-3 font-medium w-12" />
                </tr>
              </thead>
              <tbody>
                {visible.map((mail) => (
                  <MailRow key={mail.id} mail={mail} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function MailRow({ mail }: { mail: Mail }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${mail.title}"?`)) {
      dispatch(mailActions.deleteRequest(mail.id))
    }
  }
  const target = mail.status === 'draft' ? `/mail/${mail.id}/edit` : `/mail/${mail.id}`
  return (
    <tr
      className="border-t border-canvas-border hover:bg-gray-50 cursor-pointer"
      onClick={() => navigate(target)}
    >
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{mail.title}</div>
        {mail.subject && <div className="text-xs text-gray-500 truncate max-w-md">{mail.subject}</div>}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={mail.status} />
      </td>
      <td className="px-4 py-3 text-gray-700">{mail.stats?.recipientCount ?? '—'}</td>
      <td className="px-4 py-3 text-gray-700">
        {mail.stats ? formatPercent(mail.stats.openCount, mail.stats.deliveredCount) : '—'}
      </td>
      <td className="px-4 py-3 text-gray-500">{formatRelative(mail.updatedAt)}</td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600 p-1 rounded"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}
