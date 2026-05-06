import { Plus } from 'lucide-react'
import { useAppDispatch } from '@app/hooks'
import { composerActions } from '@domains/mail/store/composer/composer.slice'

export default function EmptyCanvas() {
  const dispatch = useAppDispatch()
  return (
    <div className="p-12 text-center">
      <div className="text-gray-500 text-sm mb-4">Your email is empty.</div>
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
