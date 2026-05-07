import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, FileUp, Upload, X } from 'lucide-react'
import { useAppDispatch } from '@app/hooks'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import { parseHtml } from '@domains/mail/html/parse'

type Props = {
  open: boolean
  onClose: () => void
}

export default function HtmlImportModal({ open, onClose }: Props) {
  const dispatch = useAppDispatch()
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  if (!open) return null

  const onFile = async (file: File) => {
    if (!file.type.includes('html') && !file.name.endsWith('.html')) {
      setError('Pick an .html file.')
      return
    }
    const text = await file.text()
    setRaw(text)
    setError(null)
    setWarning(null)
  }

  const onImport = () => {
    const result = parseHtml(raw)
    if (!result.ok) {
      setError(result.error)
      return
    }
    dispatch(composerActions.replaceDocument(result.document))
    setRaw('')
    setError(null)
    setWarning(null)
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-panel rounded-2xl shadow-card w-full max-w-3xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="tile w-8 h-8 tile-divider">
              <FileUp size={15} />
            </span>
            <div>
              <h2 className="font-display font-semibold tracking-display">Import HTML</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Paste or upload an .html file. The current document will be replaced.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost px-2">
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed">
              Import works best with HTML produced by this editor. External email HTML may
              import partially — anything that doesn't match a known structure becomes a
              single text block. You can always undo (⌘Z).
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">Paste HTML</label>
              <label className="text-xs text-brand-700 hover:text-brand-800 cursor-pointer inline-flex items-center gap-1">
                <Upload size={12} /> Or upload .html
                <input
                  type="file"
                  accept=".html,text/html"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onFile(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            <textarea
              className="input min-h-[280px] font-mono text-[11px] leading-relaxed scrollbar-thin"
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value)
                setError(null)
                setWarning(null)
              }}
              placeholder="<!doctype html>&#10;<html>&#10;  <body>…</body>&#10;</html>"
            />
            {raw && (
              <div className="text-[11px] text-ink-400 mt-1.5 flex items-center justify-between">
                <span>{raw.length.toLocaleString()} characters</span>
                <button
                  onClick={() => {
                    setRaw('')
                    setError(null)
                    setWarning(null)
                  }}
                  className="text-ink-500 hover:text-ink-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}
          {warning && (
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              {warning}
            </div>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-ink-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button onClick={onImport} className="btn-primary" disabled={!raw.trim()}>
            <FileUp size={14} /> Replace document
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
