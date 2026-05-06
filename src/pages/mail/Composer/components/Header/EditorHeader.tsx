import { ArrowLeft, Monitor, Smartphone, Undo2, Redo2, Send, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import {
  selectCanRedo,
  selectCanUndo,
  selectIsDirty,
  selectMailTitle,
  selectViewMode,
} from '@domains/mail/store/composer/composer.selectors'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import { cx } from '@shared/utils/cx'

export default function EditorHeader() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const title = useAppSelector(selectMailTitle)
  const viewMode = useAppSelector(selectViewMode)
  const canUndo = useAppSelector(selectCanUndo)
  const canRedo = useAppSelector(selectCanRedo)
  const isDirty = useAppSelector(selectIsDirty)

  return (
    <header className="h-14 border-b border-canvas-border bg-canvas-panel flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/mail')} className="btn-ghost px-2" title="Back">
          <ArrowLeft size={16} />
        </button>
        <input
          value={title}
          onChange={(e) => dispatch(composerActions.setMailTitle(e.target.value))}
          className="font-medium text-gray-900 bg-transparent focus:bg-gray-50 rounded px-2 py-1 outline-none border border-transparent focus:border-canvas-border min-w-64"
        />
        <span className={cx('text-xs', isDirty ? 'text-amber-600' : 'text-gray-400')}>
          {isDirty ? 'Unsaved changes' : 'All changes saved'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(composerActions.undo())}
          disabled={!canUndo}
          className="btn-ghost disabled:opacity-30"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={() => dispatch(composerActions.redo())}
          disabled={!canRedo}
          className="btn-ghost disabled:opacity-30"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>

        <div className="flex border border-canvas-border rounded-md overflow-hidden mx-2">
          <button
            onClick={() => dispatch(composerActions.setViewMode('desktop'))}
            className={cx(
              'px-3 py-1.5 text-sm flex items-center gap-1',
              viewMode === 'desktop' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            <Monitor size={14} /> Desktop
          </button>
          <button
            onClick={() => dispatch(composerActions.setViewMode('mobile'))}
            className={cx(
              'px-3 py-1.5 text-sm flex items-center gap-1',
              viewMode === 'mobile' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            <Smartphone size={14} /> Mobile
          </button>
        </div>

        <button className="btn-outline" onClick={() => dispatch(composerActions.markSaved())}>
          <Save size={14} /> Save
        </button>
        <button className="btn-primary" disabled>
          <Send size={14} /> Send
        </button>
      </div>
    </header>
  )
}
