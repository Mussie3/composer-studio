import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { CalendarClock, History as HistoryIcon, Send } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectMails } from '@domains/mail/store/mail.selectors'
import StatusBadge from '@shared/components/StatusBadge'
import { formatNumber, formatPercent, formatDateTime } from '@shared/utils/format'

export default function HistoryPage() {
  const dispatch = useAppDispatch()
  const mails = useAppSelector(selectMails)

  useEffect(() => {
    if (mails.length === 0) dispatch(mailActions.fetchListRequest())
  }, [dispatch, mails.length])

  const items = useMemo(() => {
    return mails
      .filter((m) => m.status === 'sent' || m.status === 'scheduled')
      .slice()
      .sort((a, b) => {
        const aTs = +new Date(a.sentAt ?? a.scheduledAt ?? a.updatedAt)
        const bTs = +new Date(b.sentAt ?? b.scheduledAt ?? b.updatedAt)
        return bTs - aTs
      })
  }, [mails])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>()
    items.forEach((m) => {
      const ts = m.sentAt ?? m.scheduledAt ?? m.updatedAt
      const key = dayjs(ts).format('MMMM YYYY')
      const arr = map.get(key) ?? []
      arr.push(m)
      map.set(key, arr)
    })
    return Array.from(map.entries())
  }, [items])

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-display mb-2">History</h1>
          <p className="text-sm text-ink-500">
            Sent and scheduled emails, newest first.
          </p>
        </header>

        {items.length === 0 ? (
          <div className="panel p-12 text-center">
            <HistoryIcon size={28} className="mx-auto text-ink-300 mb-2" />
            <div className="text-sm text-ink-500">Nothing has been sent yet.</div>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([month, group]) => (
              <section key={month}>
                <h2 className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
                  {month}
                </h2>
                <ol className="relative border-l border-ink-100 pl-6 space-y-3">
                  {group.map((mail) => {
                    const isScheduled = mail.status === 'scheduled'
                    const ts = mail.sentAt ?? mail.scheduledAt ?? mail.updatedAt
                    return (
                      <li key={mail.id} className="relative">
                        <span className="absolute -left-[31px] top-3 w-3 h-3 rounded-full bg-surface-panel border-2 border-brand-500" />
                        <Link
                          to={`/mail/${mail.id}`}
                          className="panel p-4 flex items-center gap-4 hover:border-brand-300 transition"
                        >
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-ink-50 grid place-items-center text-ink-400">
                            {isScheduled ? <CalendarClock size={16} /> : <Send size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-ink-900 truncate">{mail.title}</span>
                              <StatusBadge status={mail.status} />
                            </div>
                            <div className="text-xs text-ink-500 truncate">
                              {mail.subject || <em>no subject</em>} · {formatDateTime(ts)}
                            </div>
                          </div>
                          {mail.stats && (
                            <div className="flex-shrink-0 hidden md:flex items-center gap-4 text-xs">
                              <div className="text-right">
                                <div className="text-ink-500">Recipients</div>
                                <div className="font-semibold text-ink-900">
                                  {formatNumber(mail.stats.recipientCount)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-ink-500">Opens</div>
                                <div className="font-semibold text-ink-900">
                                  {formatPercent(mail.stats.openCount, mail.stats.deliveredCount)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-ink-500">Clicks</div>
                                <div className="font-semibold text-ink-900">
                                  {formatPercent(mail.stats.clickCount, mail.stats.deliveredCount)}
                                </div>
                              </div>
                            </div>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
