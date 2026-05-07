import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Undo2,
  Redo2,
  Send,
  Save,
  FileCode,
  Cloud,
  CloudOff,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import HtmlSourceModal from '../../modals/HtmlSourceModal'
import SendScheduleModal from '../../modals/SendScheduleModal'
import {
  selectCanRedo,
  selectCanUndo,
  selectIsDirty,
  selectMailTitle,
  selectViewMode,
} from '@domains/mail/store/composer/composer.selectors'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import { cx } from '@shared/utils/cx'

type Props = {
  onSave: () => void
  onExit: () => void
  mailId: string | null
}

export default function EditorHeader({ onSave, onExit, mailId }: Props) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const title = useAppSelector(selectMailTitle)
  const viewMode = useAppSelector(selectViewMode)
  const canUndo = useAppSelector(selectCanUndo)
  const canRedo = useAppSelector(selectCanRedo)
  const isDirty = useAppSelector(selectIsDirty)
  const [htmlOpen, setHtmlOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)

  const onSent = () => {
    setSendOpen(false)
    if (mailId) navigate(`/mail/${mailId}`)
  }

  return (
    <header className="h-16 border-b border-ink-100 bg-surface-panel/80 backdrop-blur flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="btn-ghost px-2" title="Back">
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col">
          <input
            value={title}
            onChange={(e) => dispatch(composerActions.setMailTitle(e.target.value))}
            className="font-display font-semibold text-ink-900 text-base tracking-display bg-transparent focus:bg-ink-50 rounded-md px-1.5 py-0.5 outline-none border border-transparent focus:border-brand-300 -ml-1.5 min-w-72"
          />
          <span
            className={cx(
              'text-[11px] flex items-center gap-1 mt-0.5 ml-0.5',
              isDirty ? 'text-amber-600' : 'text-ink-400',
            )}
          >
            {isDirty ? <CloudOff size={10} /> : <Cloud size={10} />}
            {isDirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex bg-ink-50 rounded-lg p-0.5 mr-1">
          <button
            onClick={() => dispatch(composerActions.undo())}
            disabled={!canUndo}
            className="w-8 h-8 grid place-items-center rounded-md text-ink-600 hover:bg-white hover:text-ink-900 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Undo (⌘Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={() => dispatch(composerActions.redo())}
            disabled={!canRedo}
            className="w-8 h-8 grid place-items-center rounded-md text-ink-600 hover:bg-white hover:text-ink-900 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Redo (⇧⌘Z)"
          >
            <Redo2 size={15} />
          </button>
        </div>

        <div className="flex bg-ink-50 rounded-lg p-0.5">
          <button
            onClick={() => dispatch(composerActions.setViewMode('desktop'))}
            className={cx(
              'h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition',
              viewMode === 'desktop'
                ? 'bg-white text-ink-900 shadow-soft'
                : 'text-ink-500 hover:text-ink-900',
            )}
          >
            <Monitor size={13} /> Desktop
          </button>
          <button
            onClick={() => dispatch(composerActions.setViewMode('mobile'))}
            className={cx(
              'h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition',
              viewMode === 'mobile'
                ? 'bg-white text-ink-900 shadow-soft'
                : 'text-ink-500 hover:text-ink-900',
            )}
          >
            <Smartphone size={13} /> Mobile
          </button>
        </div>

        <button
          className="btn-outline ml-1"
          onClick={() => setHtmlOpen(true)}
          title="View generated HTML"
        >
          <FileCode size={14} /> HTML
        </button>
        <button className="btn-outline" onClick={onSave}>
          <Save size={14} /> Save
        </button>
        <button
          className="btn-primary"
          onClick={() => setSendOpen(true)}
          disabled={!mailId}
          title={mailId ? 'Send or schedule this email' : 'Save the email first'}
        >
          <Send size={14} /> Send
        </button>
      </div>

      <HtmlSourceModal open={htmlOpen} onClose={() => setHtmlOpen(false)} />
      <SendScheduleModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        mailId={mailId}
        onSent={onSent}
      />
    </header>
  )
}
