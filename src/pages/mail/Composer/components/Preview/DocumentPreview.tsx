import type {
  Block,
  ButtonElement,
  ComposerDocument,
  ComposerElement,
  DividerElement,
  FooterBlock,
  ImageElement,
  SpacerElement,
  TextElement,
} from '@domains/mail/types'

const layoutToColumnSizes = (layout: Block['layout']): number[] => {
  switch (layout) {
    case 'single':
      return [1]
    case 'double-50-50':
      return [1, 1]
    case 'double-33-67':
      return [1, 2]
    case 'double-67-33':
      return [2, 1]
  }
}

type Props = {
  document: ComposerDocument
  width?: number
  className?: string
}

export default function DocumentPreview({ document: doc, width, className }: Props) {
  return (
    <div
      className={className}
      style={{
        background: doc.styles.contentBackground,
        fontFamily: doc.styles.fontFamily,
        width: width ?? doc.styles.contentWidth,
        maxWidth: '100%',
        margin: '0 auto',
      }}
    >
      {doc.blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
      <FooterView footer={doc.footer} />
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  const sizes = layoutToColumnSizes(block.layout)
  const total = sizes.reduce((a, b) => a + b, 0)
  return (
    <div
      style={{
        background: block.background,
        paddingTop: block.paddingY,
        paddingBottom: block.paddingY,
        paddingLeft: block.paddingX,
        paddingRight: block.paddingX,
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        {block.cells.map((cell, idx) => (
          <div key={cell.id} style={{ flex: `${sizes[idx] / total} 1 0`, minWidth: 0 }}>
            {cell.elements.map((el) => (
              <ElementView key={el.id} element={el} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ElementView({ element }: { element: ComposerElement }) {
  switch (element.type) {
    case 'text':
      return <TextView element={element} />
    case 'image':
      return <ImageView element={element} />
    case 'button':
      return <ButtonView element={element} />
    case 'divider':
      return <DividerView element={element} />
    case 'spacer':
      return <SpacerView element={element} />
  }
}

function TextView({ element }: { element: TextElement }) {
  return (
    <div
      style={{
        paddingTop: element.paddingY,
        paddingBottom: element.paddingY,
        paddingLeft: element.paddingX,
        paddingRight: element.paddingX,
      }}
      className="prose prose-sm max-w-none [&_p]:my-1"
      dangerouslySetInnerHTML={{ __html: element.html }}
    />
  )
}

function ImageView({ element }: { element: ImageElement }) {
  const align =
    element.alignment === 'left' ? 'flex-start' : element.alignment === 'right' ? 'flex-end' : 'center'
  return (
    <div
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
    </div>
  )
}

function ButtonView({ element }: { element: ButtonElement }) {
  const align =
    element.alignment === 'left' ? 'flex-start' : element.alignment === 'right' ? 'flex-end' : 'center'
  return (
    <div style={{ display: 'flex', justifyContent: align, paddingTop: element.marginY, paddingBottom: element.marginY }}>
      <a
        href={element.href || '#'}
        target="_blank"
        rel="noreferrer"
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
      </a>
    </div>
  )
}

function DividerView({ element }: { element: DividerElement }) {
  return (
    <div style={{ paddingTop: element.paddingY, paddingBottom: element.paddingY }}>
      <hr style={{ border: 0, borderTop: `${element.thickness}px solid ${element.color}`, margin: 0 }} />
    </div>
  )
}

function SpacerView({ element }: { element: SpacerElement }) {
  return <div style={{ height: element.height }} />
}

function FooterView({ footer }: { footer: FooterBlock }) {
  return (
    <div
      style={{
        background: footer.background,
        color: footer.textColor,
        padding: '24px 32px',
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <div style={{ marginBottom: 8 }}>{footer.helperText}</div>
      <div style={{ marginBottom: 12, opacity: 0.8 }}>
        {footer.businessName} · {footer.businessAddress}
      </div>
      {footer.showUnsubscribe && (
        <div>
          <a href="#unsubscribe" style={{ color: 'inherit', textDecoration: 'underline' }}>
            {footer.unsubscribeLabel}
          </a>
        </div>
      )}
    </div>
  )
}
