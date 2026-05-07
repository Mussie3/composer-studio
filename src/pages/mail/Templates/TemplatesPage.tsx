import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  X,
  Sparkles,
  FileText,
  Newspaper,
  Megaphone,
  FilePlus2,
  Sun,
  Receipt,
  Moon,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectMails } from '@domains/mail/store/mail.selectors'
import { TEMPLATES } from '@domains/mail/templates'
import type { Template } from '@domains/mail/types'
import DocumentPreview from '@pages/mail/Composer/components/Preview/DocumentPreview'
import { cx } from '@shared/utils/cx'

const TEMPLATE_THEME: Record<
  string,
  { tile: string; icon: React.ComponentType<{ size?: number }>; tag: string }
> = {
  blank: { tile: 'tile-spacer', icon: FilePlus2, tag: 'Empty' },
  announcement: { tile: 'tile-image', icon: Megaphone, tag: 'Marketing' },
  newsletter: { tile: 'tile-text', icon: Newspaper, tag: 'Editorial' },
  'product-update': { tile: 'tile-button', icon: FileText, tag: 'Product' },
  'soft-launch': { tile: 'tile-button', icon: Sun, tag: 'Light' },
  'minimal-receipt': { tile: 'tile-divider', icon: Receipt, tag: 'Transactional' },
  'bold-onboarding': { tile: 'tile-text', icon: Moon, tag: 'Dark' },
}

export default function TemplatesPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const list = useAppSelector(selectMails)
  const [previewing, setPreviewing] = useState<Template | null>(null)
  const lastIds = useRef<Set<string>>(new Set())
  const [submittedTemplateId, setSubmittedTemplateId] = useState<string | null>(null)

  useEffect(() => {
    if (!submittedTemplateId) return
    const created = list.find((m) => !lastIds.current.has(m.id))
    if (created) navigate(`/mail/${created.id}/edit`, { replace: true })
  }, [submittedTemplateId, list, navigate])

  const useTemplate = (template: Template) => {
    lastIds.current = new Set(list.map((m) => m.id))
    dispatch(
      mailActions.createRequest({
        title: template.id === 'blank' ? 'Untitled email' : `${template.name} draft`,
        templateId: template.id,
        document: JSON.parse(JSON.stringify(template.document)),
      }),
    )
    setSubmittedTemplateId(template.id)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto px-8 py-10">
        <header className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-3">
            <Sparkles size={11} /> Templates
          </div>
          <h1 className="font-display text-3xl font-bold tracking-display mb-2">
            Start with a beautiful template
          </h1>
          <p className="text-sm text-ink-500 max-w-xl">
            Hand-crafted starting points you can customize. Pick one and the editor opens with everything pre-arranged.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TEMPLATES.map((t) => {
            const theme = TEMPLATE_THEME[t.id] ?? TEMPLATE_THEME.blank
            return (
              <article
                key={t.id}
                className="panel overflow-hidden flex flex-col hover:shadow-card hover:-translate-y-1 transition-all duration-200"
              >
                <div className="aspect-[3/2] relative overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100/50 border-b border-ink-100">
                  <img
                    src={t.previewImage}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-ink-700 bg-surface-panel/95 backdrop-blur px-2 py-1 rounded-full shadow-soft">
                    {theme.tag}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <span className={cx('tile w-10 h-10 shrink-0', theme.tile)}>
                      <theme.icon size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-ink-900 leading-tight">
                        {t.name}
                      </h3>
                      <p className="text-[12px] text-ink-500 mt-1 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      onClick={() => setPreviewing(t)}
                      className="btn-outline flex-1 justify-center"
                      disabled={t.id === 'blank'}
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      onClick={() => useTemplate(t)}
                      className="btn-primary flex-1 justify-center"
                      disabled={submittedTemplateId === t.id}
                    >
                      Use <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {previewing && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreviewing(null)}
        >
          <div
            className="bg-surface-panel rounded-2xl shadow-card w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
              <div>
                <h2 className="font-display font-semibold tracking-display">{previewing.name}</h2>
                <p className="text-xs text-ink-500 mt-0.5">{previewing.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => useTemplate(previewing)} className="btn-primary">
                  Use this <ArrowRight size={14} />
                </button>
                <button onClick={() => setPreviewing(null)} className="btn-ghost px-2">
                  <X size={16} />
                </button>
              </div>
            </header>
            <div className="flex-1 min-h-0 overflow-auto bg-surface-inset p-6 flex justify-center">
              <DocumentPreview document={previewing.document} className="shadow-soft rounded-md" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
