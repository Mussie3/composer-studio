import { useMemo, useState } from 'react'
import { Copy, Download, Eye, X, FileCode } from 'lucide-react'
import { useAppSelector } from '@app/hooks'
import { selectDocument, selectMailTitle } from '@domains/mail/store/composer/composer.selectors'
import { generateHtml } from '@domains/mail/html/generate'
import { cx } from '@shared/utils/cx'

type Tab = 'source' | 'preview'

type Props = {
  open: boolean
  onClose: () => void
}

export default function HtmlSourceModal({ open, onClose }: Props) {
  const doc = useAppSelector(selectDocument)
  const title = useAppSelector(selectMailTitle)
  const [tab, setTab] = useState<Tab>('source')
  const [copied, setCopied] = useState(false)

  const html = useMemo(
    () => (open ? generateHtml(doc, { subject: title }) : ''),
    [open, doc, title],
  )

  if (!open) return null

  const onCopy = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const onDownload = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug(title) || 'email'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
        <header className="px-5 py-3 border-b border-canvas-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode size={16} className="text-gray-500" />
            <h2 className="font-semibold">Generated HTML</h2>
            <span className="text-xs text-gray-500 ml-2">{html.length.toLocaleString()} chars</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-canvas-border rounded-md overflow-hidden">
              <button
                onClick={() => setTab('source')}
                className={cx(
                  'px-3 py-1.5 text-sm flex items-center gap-1',
                  tab === 'source' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <FileCode size={14} /> Source
              </button>
              <button
                onClick={() => setTab('preview')}
                className={cx(
                  'px-3 py-1.5 text-sm flex items-center gap-1',
                  tab === 'preview' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <Eye size={14} /> Rendered
              </button>
            </div>
            <button onClick={onCopy} className="btn-outline">
              <Copy size={14} /> {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={onDownload} className="btn-outline">
              <Download size={14} /> Download
            </button>
            <button onClick={onClose} className="btn-ghost px-2" title="Close">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden bg-gray-50">
          {tab === 'source' ? (
            <pre className="h-full overflow-auto p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap">
              {html}
            </pre>
          ) : (
            <iframe
              title="Rendered email"
              srcDoc={html}
              className="w-full h-full bg-white"
              sandbox="allow-same-origin"
            />
          )}
        </div>
      </div>
    </div>
  )
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
