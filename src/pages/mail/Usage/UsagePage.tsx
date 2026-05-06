import { useEffect, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import dayjs from 'dayjs'
import { Mail as MailIcon, MousePointerClick, Eye, AlertCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectMails } from '@domains/mail/store/mail.selectors'
import { formatNumber, formatPercent } from '@shared/utils/format'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
}

export default function UsagePage() {
  const dispatch = useAppDispatch()
  const mails = useAppSelector(selectMails)

  useEffect(() => {
    if (mails.length === 0) dispatch(mailActions.fetchListRequest())
  }, [dispatch, mails.length])

  const sent = useMemo(() => mails.filter((m) => m.status === 'sent' && m.stats), [mails])

  const totals = useMemo(() => {
    const acc = sent.reduce(
      (a, m) => ({
        recipients: a.recipients + (m.stats?.recipientCount ?? 0),
        delivered: a.delivered + (m.stats?.deliveredCount ?? 0),
        opens: a.opens + (m.stats?.openCount ?? 0),
        clicks: a.clicks + (m.stats?.clickCount ?? 0),
        unsubs: a.unsubs + (m.stats?.unsubscribeCount ?? 0),
        bounces: a.bounces + (m.stats?.bounceCount ?? 0),
      }),
      { recipients: 0, delivered: 0, opens: 0, clicks: 0, unsubs: 0, bounces: 0 },
    )
    return {
      ...acc,
      sentCount: sent.length,
      openRate: acc.delivered ? acc.opens / acc.delivered : 0,
      clickRate: acc.delivered ? acc.clicks / acc.delivered : 0,
    }
  }, [sent])

  const sendsByDay = useMemo(() => {
    const days = 30
    const buckets = new Map<string, number>()
    for (let i = 0; i < days; i++) {
      buckets.set(dayjs().subtract(days - 1 - i, 'day').format('YYYY-MM-DD'), 0)
    }
    sent.forEach((m) => {
      if (!m.sentAt) return
      const key = dayjs(m.sentAt).format('YYYY-MM-DD')
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
    })
    return {
      labels: Array.from(buckets.keys()).map((d) => dayjs(d).format('MMM D')),
      values: Array.from(buckets.values()),
    }
  }, [sent])

  const perEmail = useMemo(() => {
    const top = sent.slice(0, 8).reverse()
    return {
      labels: top.map((m) => truncate(m.title, 22)),
      openRates: top.map((m) =>
        m.stats?.deliveredCount ? (m.stats.openCount / m.stats.deliveredCount) * 100 : 0,
      ),
      clickRates: top.map((m) =>
        m.stats?.deliveredCount ? (m.stats.clickCount / m.stats.deliveredCount) * 100 : 0,
      ),
    }
  }, [sent])

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Usage</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Volume, opens, and clicks across all sent emails.
          </p>
        </header>

        {sent.length === 0 ? (
          <div className="panel p-12 text-center">
            <AlertCircle size={28} className="mx-auto text-gray-300 mb-2" />
            <div className="text-sm text-gray-500">
              Send some emails to see usage stats here.
            </div>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat
                icon={<MailIcon size={14} />}
                label="Sent campaigns"
                value={formatNumber(totals.sentCount)}
                sub={`${formatNumber(totals.recipients)} recipients`}
              />
              <Stat
                icon={<Eye size={14} />}
                label="Average open rate"
                value={`${(totals.openRate * 100).toFixed(1)}%`}
                sub={`${formatNumber(totals.opens)} opens`}
              />
              <Stat
                icon={<MousePointerClick size={14} />}
                label="Average click rate"
                value={`${(totals.clickRate * 100).toFixed(1)}%`}
                sub={`${formatNumber(totals.clicks)} clicks`}
              />
              <Stat
                icon={<AlertCircle size={14} />}
                label="Unsubscribes"
                value={formatNumber(totals.unsubs)}
                sub={`${formatNumber(totals.bounces)} bounces`}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="panel p-5 lg:col-span-2">
                <h3 className="font-semibold mb-1">Sends per day</h3>
                <p className="text-xs text-gray-500 mb-4">Last 30 days</p>
                <div className="h-64">
                  <Line
                    options={CHART_OPTIONS}
                    data={{
                      labels: sendsByDay.labels,
                      datasets: [
                        {
                          data: sendsByDay.values,
                          borderColor: '#3a6df0',
                          backgroundColor: 'rgba(58,109,240,0.12)',
                          fill: true,
                          tension: 0.3,
                          pointRadius: 0,
                          borderWidth: 2,
                        },
                      ],
                    }}
                  />
                </div>
              </div>

              <div className="panel p-5">
                <h3 className="font-semibold mb-1">Engagement breakdown</h3>
                <p className="text-xs text-gray-500 mb-4">All-time totals</p>
                <div className="h-64">
                  <Doughnut
                    options={{ ...CHART_OPTIONS, plugins: { legend: { display: true, position: 'bottom' as const } } }}
                    data={{
                      labels: ['Opens', 'Clicks', 'Unsubs', 'Bounces'],
                      datasets: [
                        {
                          data: [totals.opens, totals.clicks, totals.unsubs, totals.bounces],
                          backgroundColor: ['#3a6df0', '#10b981', '#f59e0b', '#ef4444'],
                          borderWidth: 0,
                        },
                      ],
                    }}
                  />
                </div>
              </div>

              <div className="panel p-5 lg:col-span-3">
                <h3 className="font-semibold mb-1">Open and click rate by email</h3>
                <p className="text-xs text-gray-500 mb-4">Most recent {perEmail.labels.length} sent</p>
                <div className="h-72">
                  <Bar
                    options={{
                      ...CHART_OPTIONS,
                      plugins: { legend: { display: true, position: 'top' as const } },
                      scales: { y: { ticks: { callback: (v: string | number) => `${v}%` } } },
                    }}
                    data={{
                      labels: perEmail.labels,
                      datasets: [
                        { label: 'Open rate', data: perEmail.openRates, backgroundColor: '#3a6df0', borderRadius: 4 },
                        { label: 'Click rate', data: perEmail.clickRates, backgroundColor: '#10b981', borderRadius: 4 },
                      ],
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="mt-6 panel overflow-hidden">
              <header className="px-5 py-3 border-b border-canvas-border">
                <h3 className="font-semibold">Recent sends</h3>
              </header>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Title</th>
                    <th className="text-left px-4 py-2 font-medium w-32">Recipients</th>
                    <th className="text-left px-4 py-2 font-medium w-28">Open rate</th>
                    <th className="text-left px-4 py-2 font-medium w-28">Click rate</th>
                    <th className="text-left px-4 py-2 font-medium w-36">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {sent.slice(0, 10).map((mail) => (
                    <tr key={mail.id} className="border-t border-canvas-border">
                      <td className="px-4 py-2 font-medium">{mail.title}</td>
                      <td className="px-4 py-2">{formatNumber(mail.stats?.recipientCount)}</td>
                      <td className="px-4 py-2">
                        {formatPercent(mail.stats?.openCount ?? 0, mail.stats?.deliveredCount ?? 0)}
                      </td>
                      <td className="px-4 py-2">
                        {formatPercent(mail.stats?.clickCount ?? 0, mail.stats?.deliveredCount ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {mail.sentAt ? dayjs(mail.sentAt).format('MMM D, YYYY') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="panel p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1">
        {icon} {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
