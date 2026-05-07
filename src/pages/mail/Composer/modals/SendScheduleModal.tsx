import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarClock, Send, Upload, X, Users, AlertTriangle, Check } from 'lucide-react'
import Papa from 'papaparse'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectIsSending } from '@domains/mail/store/mail.selectors'
import {
  selectDocument,
  selectMailTitle,
} from '@domains/mail/store/composer/composer.selectors'
import type { Recipient } from '@domains/mail/types'
import { cx } from '@shared/utils/cx'
import TokenMenu from '@shared/components/TokenMenu'

type Props = {
  open: boolean
  onClose: () => void
  mailId: string | null
  onSent: (mode: 'send' | 'schedule') => void
}

type SendMode = 'now' | 'later'

export default function SendScheduleModal({ open, onClose, mailId, onSent }: Props) {
  const dispatch = useAppDispatch()
  const sender = useAppSelector((s) => s.mail.sender)
  const document = useAppSelector(selectDocument)
  const title = useAppSelector(selectMailTitle)
  const isSending = useAppSelector(selectIsSending)
  const list = useAppSelector((s) => s.mail.list)
  const currentMail = useMemo(() => list.find((m) => m.id === mailId), [list, mailId])

  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [recipientsRaw, setRecipientsRaw] = useState('')
  const [mode, setMode] = useState<SendMode>('now')
  const [scheduleAt, setScheduleAt] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open || !currentMail) return
    setSubject(currentMail.subject || title)
    setPreheader(currentMail.preheader)
    setRecipientsRaw(currentMail.recipients.map((r) => r.email).join('\n'))
    setSubmitted(false)
    setMode('now')
    setScheduleAt(defaultSchedule())
  }, [open, currentMail, title])

  const recipients = useMemo(() => parseRecipients(recipientsRaw), [recipientsRaw])
  const invalidCount = recipients.invalid.length
  const validCount = recipients.valid.length

  const onCsvUpload = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rows = results.data
        const emailKey =
          Object.keys(rows[0] ?? {}).find((k) => k.toLowerCase().includes('email')) ??
          Object.keys(rows[0] ?? {})[0]
        if (!emailKey) return
        const lines = rows.map((r) => r[emailKey]).filter(Boolean)
        setRecipientsRaw(lines.join('\n'))
      },
    })
  }

  const canSend =
    !isSending &&
    !submitted &&
    !!mailId &&
    !!subject.trim() &&
    validCount > 0 &&
    invalidCount === 0 &&
    (mode === 'now' || (!!scheduleAt && new Date(scheduleAt) > new Date()))

  const onSubmit = () => {
    if (!canSend || !mailId) return
    setSubmitted(true)
    dispatch(
      mailActions.submitForSendRequest({
        id: mailId,
        patch: {
          subject: subject.trim(),
          preheader: preheader.trim(),
          senderName: sender.senderName,
          senderEmail: sender.senderEmail,
          replyToEmail: sender.replyToEmail,
          recipients: recipients.valid,
          document,
          status: mode === 'now' ? 'sent' : 'scheduled',
        },
        scheduledAt: mode === 'later' ? new Date(scheduleAt).toISOString() : null,
      }),
    )
  }

  // close on send-success
  const wasSendingRef = useRef(false)
  useEffect(() => {
    if (wasSendingRef.current && !isSending && submitted) {
      onSent(mode === 'now' ? 'send' : 'schedule')
    }
    wasSendingRef.current = isSending
  }, [isSending, submitted, mode, onSent])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-panel rounded-2xl shadow-card w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-ink-500" />
            <h2 className="font-semibold">Send email</h2>
          </div>
          <button onClick={onClose} className="btn-ghost px-2" disabled={isSending}>
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          <section>
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
              Email details
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label !mb-0">Subject line</label>
                  <TokenMenu onInsert={(t) => setSubject((s) => s + t)} variant="button" />
                </div>
                <input
                  className="input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What recipients see in their inbox"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label !mb-0">Preheader (optional)</label>
                  <TokenMenu onInsert={(t) => setPreheader((s) => s + t)} variant="button" />
                </div>
                <input
                  className="input"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="Preview snippet shown next to the subject"
                />
              </div>
              <div className="text-xs text-ink-500 bg-ink-50 border border-ink-100 rounded p-3">
                <div>
                  <strong>From:</strong> {sender.senderName} &lt;{sender.senderEmail}&gt;
                </div>
                <div>
                  <strong>Reply-to:</strong> {sender.replyToEmail}
                </div>
                <div className="text-ink-400 mt-1">
                  Edit these in <a href="/mail/settings" className="underline">Settings</a>.
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                Recipients
              </h3>
              <label className="text-xs text-brand-600 hover:text-brand-700 cursor-pointer inline-flex items-center gap-1">
                <Upload size={12} /> Upload CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onCsvUpload(file)
                  }}
                />
              </label>
            </div>
            <textarea
              className="input min-h-32 font-mono text-xs"
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
              placeholder="One email per line, or upload a CSV with an email column"
            />
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 text-ink-600">
                <Users size={12} /> {validCount} valid
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600">
                  <AlertTriangle size={12} /> {invalidCount} invalid
                  <span className="text-ink-500 ml-1 truncate max-w-xs">
                    ({recipients.invalid.slice(0, 3).join(', ')}
                    {invalidCount > 3 ? '…' : ''})
                  </span>
                </span>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
              When
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('now')}
                className={cx(
                  'p-3 border rounded-md text-left transition',
                  mode === 'now'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-ink-100 hover:border-brand-300',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Send size={14} className={mode === 'now' ? 'text-brand-600' : 'text-ink-400'} />
                  <span className="font-medium text-sm">Send now</span>
                </div>
                <div className="text-xs text-ink-500">
                  Deliver immediately to all valid recipients.
                </div>
              </button>
              <button
                onClick={() => setMode('later')}
                className={cx(
                  'p-3 border rounded-md text-left transition',
                  mode === 'later'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-ink-100 hover:border-brand-300',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CalendarClock
                    size={14}
                    className={mode === 'later' ? 'text-brand-600' : 'text-ink-400'}
                  />
                  <span className="font-medium text-sm">Schedule</span>
                </div>
                <div className="text-xs text-ink-500">Choose a future time.</div>
              </button>
            </div>
            {mode === 'later' && (
              <div className="mt-3">
                <label className="label">Send at</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  min={defaultSchedule()}
                />
              </div>
            )}
          </section>
        </div>

        <footer className="px-5 py-3 border-t border-ink-100 flex items-center justify-between">
          <div className="text-xs text-ink-500">
            {validCount > 0 && (
              <>Will be {mode === 'now' ? 'sent' : 'scheduled'} to {validCount} recipient{validCount === 1 ? '' : 's'}.</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-outline" disabled={isSending}>
              Cancel
            </button>
            <button onClick={onSubmit} className="btn-primary" disabled={!canSend}>
              {isSending ? (
                'Working…'
              ) : mode === 'now' ? (
                <>
                  <Send size={14} /> Send now
                </>
              ) : (
                <>
                  <CalendarClock size={14} /> Schedule
                </>
              )}
              {!isSending && submitted && <Check size={14} />}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    window.document.body,
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const parseRecipients = (raw: string): { valid: Recipient[]; invalid: string[] } => {
  const valid: Recipient[] = []
  const invalid: string[] = []
  const seen = new Set<string>()
  raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const email = entry.replace(/^.*<|>.*$/g, '').trim()
      if (!EMAIL_RE.test(email)) {
        invalid.push(entry)
        return
      }
      const lower = email.toLowerCase()
      if (seen.has(lower)) return
      seen.add(lower)
      valid.push({ email, fields: {} })
    })
  return { valid, invalid }
}

const defaultSchedule = () => {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60 * 1000)
  return local.toISOString().slice(0, 16)
}
