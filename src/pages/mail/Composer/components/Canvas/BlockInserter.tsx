import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppDispatch } from '@app/hooks'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import type { BlockLayout } from '@domains/mail/types'
import { cx } from '@shared/utils/cx'

const LAYOUTS: { id: BlockLayout; label: string; ratio: [number, number] }[] = [
  { id: 'single', label: '1 column', ratio: [1, 0] },
  { id: 'double-50-50', label: '2 equal', ratio: [1, 1] },
  { id: 'double-33-67', label: '1 : 2', ratio: [1, 2] },
  { id: 'double-67-33', label: '2 : 1', ratio: [2, 1] },
]

type Props = {
  /** Position to insert at — i.e. index passed to addBlock. */
  index: number
}

export default function BlockInserter({ index }: Props) {
  const dispatch = useAppDispatch()
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

  const insert = (layout: BlockLayout) => {
    dispatch(composerActions.addBlock({ layout, index }))
    setOpen(false)
  }

  return (
    <div
      ref={ref}
      className={cx(
        'group relative h-3 -my-1 z-20 transition-opacity',
        !open && 'opacity-0 hover:opacity-100',
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* hairline */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-brand-400/60" />
      {/* button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-6 h-6 rounded-full grid place-items-center text-white shadow-soft transition-all',
          'tile-brand hover:scale-110',
        )}
        title="Insert a block here"
      >
        <Plus size={13} />
      </button>

      {open && (
        <div
          className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-40 panel shadow-card w-64 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-ink-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Insert block
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-2">
            {LAYOUTS.map((l) => {
              const isSingle = l.id === 'single'
              return (
                <button
                  key={l.id}
                  onClick={() => insert(l.id)}
                  className="layout-card text-center"
                  title={l.label}
                >
                  <div
                    className={cx(
                      'flex gap-1 mb-2',
                      isSingle ? 'justify-center' : '',
                    )}
                  >
                    {isSingle ? (
                      <span className="h-5 w-full rounded-md bg-gradient-to-br from-brand-100 to-brand-200/60" />
                    ) : (
                      <>
                        <span
                          className="h-5 rounded-md bg-gradient-to-br from-brand-100 to-brand-200/60"
                          style={{ flex: l.ratio[0] }}
                        />
                        <span
                          className="h-5 rounded-md bg-gradient-to-br from-brand-100 to-brand-200/60"
                          style={{ flex: l.ratio[1] }}
                        />
                      </>
                    )}
                  </div>
                  <div className="text-[12px] font-medium text-ink-700">{l.label}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
