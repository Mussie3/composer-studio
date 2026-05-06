import type { MailStatus } from '@domains/mail/types'
import { cx } from '@shared/utils/cx'

const STYLES: Record<MailStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-amber-100 text-amber-800',
  sent: 'bg-emerald-100 text-emerald-800',
}

const LABELS: Record<MailStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  sent: 'Sent',
}

export default function StatusBadge({ status }: { status: MailStatus }) {
  return (
    <span className={cx('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', STYLES[status])}>
      {LABELS[status]}
    </span>
  )
}
