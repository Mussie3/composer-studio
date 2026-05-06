import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export const formatRelative = (iso: string | null | undefined) => {
  if (!iso) return '—'
  return dayjs(iso).fromNow()
}

export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '—'
  return dayjs(iso).format('MMM D, YYYY · HH:mm')
}

export const formatNumber = (n: number | null | undefined) => {
  if (n == null) return '—'
  return n.toLocaleString()
}

export const formatPercent = (numerator: number, denominator: number) => {
  if (!denominator) return '—'
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}
