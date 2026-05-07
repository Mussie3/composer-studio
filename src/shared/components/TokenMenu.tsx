import { useEffect, useRef, useState } from 'react'
import { Braces, ChevronDown } from 'lucide-react'
import { TOKENS, renderToken } from '@domains/mail/tokens'
import { cx } from '@shared/utils/cx'

type Props = {
  onInsert: (token: string) => void
  variant?: 'button' | 'icon'
  className?: string
}

export default function TokenMenu({ onInsert, variant = 'button', className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={ref} className={cx('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          variant === 'icon'
            ? 'btn-ghost px-2'
            : 'inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-ink-100 bg-surface-panel hover:bg-ink-50 text-ink-700'
        }
        title="Insert personalization token"
      >
        <Braces size={variant === 'icon' ? 14 : 12} />
        {variant === 'button' && (
          <>
            Token <ChevronDown size={11} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-72 panel shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-ink-100">
            <div className="text-xs font-semibold text-ink-700">Personalization tokens</div>
            <div className="text-[11px] text-ink-500 mt-0.5">
              Replaced per-recipient at send time.
            </div>
          </div>
          <ul className="py-1 max-h-64 overflow-auto">
            {TOKENS.map((t) => (
              <li key={t.key}>
                <button
                  type="button"
                  onClick={() => {
                    onInsert(renderToken(t.key))
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-ink-50 transition"
                >
                  <div className="text-xs font-mono text-brand-700">{renderToken(t.key)}</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{t.description}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
