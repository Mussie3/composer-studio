import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FilePlus2, FileText } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectMails } from '@domains/mail/store/mail.selectors'
import { createSeedDocument, createEmptyDocument } from '@domains/mail/factories'
import { cx } from '@shared/utils/cx'

export default function NewMailPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const list = useAppSelector(selectMails)
  const lastIds = useRef<Set<string>>(new Set())
  const [title, setTitle] = useState('Untitled email')
  const [seed, setSeed] = useState<'seed' | 'blank'>('seed')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!submitted) return
    const created = list.find((m) => !lastIds.current.has(m.id))
    if (created) navigate(`/mail/${created.id}/edit`, { replace: true })
  }, [list, submitted, navigate])

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault()
    lastIds.current = new Set(list.map((m) => m.id))
    dispatch(
      mailActions.createRequest({
        title: title.trim() || 'Untitled email',
        document: seed === 'seed' ? createSeedDocument() : createEmptyDocument(),
      }),
    )
    setSubmitted(true)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-8 py-10">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-2xl font-semibold mb-1">New email</h1>
        <p className="text-sm text-gray-500 mb-6">Give it a name, pick a starting point.</p>

        <form onSubmit={onCreate} className="panel p-6 space-y-5">
          <div>
            <label className="label">Email title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="e.g. April product update"
            />
            <p className="text-xs text-gray-500 mt-1">
              Internal only — your subscribers won’t see this.
            </p>
          </div>

          <div>
            <label className="label">Starting point</label>
            <div className="grid grid-cols-2 gap-3">
              <SeedCard
                selected={seed === 'seed'}
                onSelect={() => setSeed('seed')}
                icon={<FileText size={18} />}
                title="Sample layout"
                description="Image header + intro + 2-column features + CTA. Easy to edit."
              />
              <SeedCard
                selected={seed === 'blank'}
                onSelect={() => setSeed('blank')}
                icon={<FilePlus2 size={18} />}
                title="Blank canvas"
                description="Start with nothing. Add blocks one at a time."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/mail')} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitted}>
              {submitted ? 'Creating…' : 'Create and open editor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SeedCard({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        'text-left p-4 border rounded-lg transition',
        selected
          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
          : 'border-canvas-border bg-canvas-panel hover:border-brand-300',
      )}
    >
      <div className={cx('mb-2', selected ? 'text-brand-700' : 'text-gray-500')}>{icon}</div>
      <div className="font-medium text-gray-900 mb-1">{title}</div>
      <div className="text-xs text-gray-500 leading-relaxed">{description}</div>
    </button>
  )
}
