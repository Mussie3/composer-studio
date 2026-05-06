import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { mailActions } from '@domains/mail/store/mail.slice'
import { selectMails } from '@domains/mail/store/mail.selectors'
import { TEMPLATES } from '@domains/mail/templates'
import type { Template } from '@domains/mail/types'
import DocumentPreview from '@pages/mail/Composer/components/Preview/DocumentPreview'

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
      <div className="max-w-6xl mx-auto px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pick a starting point. You can edit everything once the email is created.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <article key={t.id} className="panel overflow-hidden flex flex-col">
              <div className="aspect-[3/2] bg-gray-100 overflow-hidden">
                <img src={t.previewImage} alt={t.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed flex-1">{t.description}</p>
                <div className="flex items-center gap-2 mt-4">
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
          ))}
        </div>
      </div>

      {previewing && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          onClick={() => setPreviewing(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-5 py-3 border-b border-canvas-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{previewing.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{previewing.description}</p>
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
            <div className="flex-1 min-h-0 overflow-auto bg-canvas p-6 flex justify-center">
              <DocumentPreview document={previewing.document} className="shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
