import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Mail as MailIcon,
  Trash2,
  PenLine,
  CalendarClock,
  Send,
  Inbox,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectIsLoadingList, selectMails } from '@domains/mail/store/mail.selectors'
import StatusBadge from '@shared/components/StatusBadge'
import { formatPercent, formatRelative } from '@shared/utils/format'
import { cx } from '@shared/utils/cx'
import type { Mail, MailStatus } from '@domains/mail/types'

type FilterValue = 'all' | MailStatus

const FILTERS: {
  value: FilterValue
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}[] = [
  { value: 'all', label: 'All', icon: Inbox },
  { value: 'draft', label: 'Drafts', icon: PenLine },
  { value: 'scheduled', label: 'Scheduled', icon: CalendarClock },
  { value: 'sent', label: 'Sent', icon: Send },
]

export default function MailListPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const mails = useAppSelector(selectMails)
  const isLoading = useAppSelector(selectIsLoadingList)
  const [filter, setFilter] = useState<FilterValue>('all')
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
      <div className="max-w-6xl mx-auto px-8 py-10">
        <header className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-display">Emails</h1>
            <p className="text-sm text-ink-500 mt-1">
              Drafts, scheduled, and sent campaigns. <span className="text-ink-700 font-medium">{mails.length}</span> total.
            </p>
          </div>
          <Link to="/mail/new" className="btn-primary">
            <Plus size={16} />
            New email
          </Link>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cx(
                'panel p-4 text-left transition-all hover:shadow-card hover:-translate-y-0.5',
                filter === f.value && 'border-brand-300 ring-2 ring-brand-200',
              )}
            >
              <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
                <f.icon size={12} />
                <span className="uppercase tracking-wider font-semibold">{f.label}</span>
              </div>
              <div className="font-display text-2xl font-bold text-ink-900">
                {f.value === 'all' ? counts.all : counts[f.value]}
              </div>
            </button>
          ))}
        </section>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search emails by title..."
              className="input pl-10"
            />
          </div>
          <div className="text-xs text-ink-500">
            {visible.length} {visible.length === 1 ? 'result' : 'results'}
          </div>
        </div>

        <div className="panel overflow-hidden">
          {isLoading && mails.length === 0 ? (
            <div className="p-16 text-center text-sm text-ink-500">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl tile tile-brand grid place-items-center">
                <MailIcon size={26} />
              </div>
              <div className="font-display text-lg font-semibold mb-1">
                {query ? 'No emails match your search' : 'No emails yet'}
              </div>
              <div className="text-sm text-ink-500 mb-5">
                {query ? 'Try a different query.' : 'Start your first campaign in seconds.'}
              </div>
              {!query && (
                <button onClick={() => navigate('/mail/new')} className="btn-primary">
                  <Plus size={14} /> Create your first email
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-inset border-b border-ink-100">
                <tr className="text-[11px] uppercase tracking-wider text-ink-500">
                  <th className="text-left px-5 py-3 font-semibold">Title</th>
                  <th className="text-left px-4 py-3 font-semibold w-28">Status</th>
                  <th className="text-left px-4 py-3 font-semibold w-28">Recipients</th>
                  <th className="text-left px-4 py-3 font-semibold w-28">Open rate</th>
                  <th className="text-left px-4 py-3 font-semibold w-36">Updated</th>
                  <th className="text-right px-4 py-3 w-12" />
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
      className="border-t border-ink-100 hover:bg-brand-50/40 cursor-pointer transition-colors group"
      onClick={() => navigate(target)}
    >
      <td className="px-5 py-3.5">
        <div className="font-medium text-ink-900 group-hover:text-brand-700 transition-colors">
          {mail.title}
        </div>
        {mail.subject && (
          <div className="text-xs text-ink-500 truncate max-w-md mt-0.5">{mail.subject}</div>
        )}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={mail.status} />
      </td>
      <td className="px-4 py-3.5 text-ink-700">{mail.stats?.recipientCount ?? '—'}</td>
      <td className="px-4 py-3.5 text-ink-700">
        {mail.stats ? formatPercent(mail.stats.openCount, mail.stats.deliveredCount) : '—'}
      </td>
      <td className="px-4 py-3.5 text-ink-500">{formatRelative(mail.updatedAt)}</td>
      <td className="px-4 py-3.5 text-right">
        <button
          onClick={onDelete}
          className="text-ink-300 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}
