import { Layers, Plus } from 'lucide-react'
import { useAppDispatch } from '@app/hooks'
import { composerActions } from '@domains/mail/store/composer/composer.slice'

export default function EmptyCanvas() {
  const dispatch = useAppDispatch()
  return (
    <div className="p-16 text-center">
      <div className="mx-auto mb-5 w-20 h-20 rounded-3xl tile tile-brand shadow-card grid place-items-center">
        <Layers size={32} />
      </div>
      <h3 className="font-display text-xl font-semibold tracking-display mb-1.5">
        Start building
      </h3>
      <p className="text-sm text-ink-500 max-w-sm mx-auto leading-relaxed mb-6">
        Drop in a layout from the sidebar to begin, or jump straight in with a single column.
      </p>
      <button
        className="btn-primary"
        onClick={(e) => {
          e.stopPropagation()
          dispatch(composerActions.addBlock({ layout: 'single' }))
        }}
      >
        <Plus size={14} /> Add a block
      </button>
    </div>
  )
}
