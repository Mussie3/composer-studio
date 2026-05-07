import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import type {
  ButtonElement,
  ComposerElement,
  DividerElement,
  ImageElement,
  SpacerElement,
  TextElement,
} from '@domains/mail/types'
import RichTextEditor from '../RichText/RichTextEditor'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import { selectSelection } from '@domains/mail/store/composer/composer.selectors'
import { cx } from '@shared/utils/cx'
import { useImageUpload } from '../../hooks/useImageUpload'

type Props = {
  blockId: string
  cellId: string
  element: ComposerElement
}

export default function CanvasElement({ blockId, cellId, element }: Props) {
  const dispatch = useAppDispatch()
  const selection = useAppSelector(selectSelection)
  const isSelected =
    selection?.kind === 'element' &&
    selection.elementId === element.id

  const select = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(composerActions.setSelection({ kind: 'element', blockId, cellId, elementId: element.id }))
  }

  return (
    <div
      onClick={select}
      className={cx(
        'relative group cursor-pointer transition-shadow',
        isSelected && 'outline outline-2 outline-brand-500 -outline-offset-2',
        !isSelected && 'hover:outline hover:outline-1 hover:outline-brand-500/40 hover:-outline-offset-1',
      )}
    >
      {element.type === 'text' && <TextRenderer element={element} blockId={blockId} cellId={cellId} isSelected={isSelected} />}
      {element.type === 'image' && (
        <ImageRenderer element={element} blockId={blockId} cellId={cellId} />
      )}
      {element.type === 'button' && <ButtonRenderer element={element} />}
      {element.type === 'divider' && <DividerRenderer element={element} />}
      {element.type === 'spacer' && <SpacerRenderer element={element} />}
    </div>
  )
}

function TextRenderer({
  element,
  blockId,
  cellId,
  isSelected,
}: {
  element: TextElement
  blockId: string
  cellId: string
  isSelected: boolean
}) {
  const dispatch = useAppDispatch()
  return (
    <div style={{ paddingTop: element.paddingY, paddingBottom: element.paddingY, paddingLeft: element.paddingX, paddingRight: element.paddingX }}>
      {isSelected ? (
        <RichTextEditor
          html={element.html}
          onChange={(html) =>
            dispatch(
              composerActions.updateElement({
                blockId,
                cellId,
                elementId: element.id,
                patch: { html } as Partial<ComposerElement>,
              }),
            )
          }
        />
      ) : (
        <div
          className="prose prose-sm max-w-none [&_p]:my-1"
          dangerouslySetInnerHTML={{ __html: element.html }}
        />
      )}
    </div>
  )
}

function ImageRenderer({
  element,
  blockId,
  cellId,
}: {
  element: ImageElement
  blockId: string
  cellId: string
}) {
  const dispatch = useAppDispatch()
  const [isOver, setIsOver] = useState(false)
  const { upload, isUploading, error } = useImageUpload((result) =>
    dispatch(
      composerActions.updateElement({
        blockId,
        cellId,
        elementId: element.id,
        patch: { src: result.url, alt: result.name.replace(/\.[^.]+$/, '') } as Partial<ComposerElement>,
      }),
    ),
  )

  const align = element.alignment === 'left' ? 'flex-start' : element.alignment === 'right' ? 'flex-end' : 'center'

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      className="relative"
      style={{
        display: 'flex',
        justifyContent: align,
        paddingTop: element.paddingY,
        paddingBottom: element.paddingY,
        paddingLeft: element.paddingX,
        paddingRight: element.paddingX,
      }}
    >
      <img
        src={element.src}
        alt={element.alt}
        style={{ width: `${element.widthPct}%`, maxWidth: '100%', display: 'block' }}
      />
      {(isOver || isUploading) && (
        <div className="absolute inset-2 rounded-lg border-2 border-dashed border-brand-400 bg-brand-50/90 backdrop-blur-sm flex flex-col items-center justify-center text-brand-700 pointer-events-none">
          {isUploading ? (
            <>
              <Loader2 size={20} className="animate-spin mb-1" />
              <span className="text-xs font-medium">Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={20} className="mb-1" />
              <span className="text-xs font-medium">Drop image to replace</span>
            </>
          )}
        </div>
      )}
      {error && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-red-600 bg-white px-2 py-0.5 rounded shadow-soft">
          {error}
        </div>
      )}
    </div>
  )
}

function ButtonRenderer({ element }: { element: ButtonElement }) {
  const align = element.alignment === 'left' ? 'flex-start' : element.alignment === 'right' ? 'flex-end' : 'center'
  return (
    <div style={{ display: 'flex', justifyContent: align, paddingTop: element.marginY, paddingBottom: element.marginY }}>
      <span
        style={{
          background: element.background,
          color: element.textColor,
          borderRadius: element.borderRadius,
          padding: `${element.paddingY}px ${element.paddingX}px`,
          fontWeight: element.fontWeight,
          display: 'inline-block',
          textDecoration: 'none',
          fontSize: 14,
        }}
      >
        {element.label}
      </span>
    </div>
  )
}

function DividerRenderer({ element }: { element: DividerElement }) {
  return (
    <div style={{ paddingTop: element.paddingY, paddingBottom: element.paddingY }}>
      <hr style={{ border: 0, borderTop: `${element.thickness}px solid ${element.color}`, margin: 0 }} />
    </div>
  )
}

function SpacerRenderer({ element }: { element: SpacerElement }) {
  return <div style={{ height: element.height }} />
}
