import type {
  Block,
  ButtonElement,
  Cell,
  ComposerDocument,
  ComposerElement,
  DividerElement,
  FooterBlock,
  ImageElement,
  SpacerElement,
  TextElement,
} from '@domains/mail/types'
import { escapeAttr, escapeHtml, renderStyle } from './inline-style'

const layoutToColumnPercents = (layout: Block['layout']): number[] => {
  switch (layout) {
    case 'single':
      return [100]
    case 'double-50-50':
      return [50, 50]
    case 'double-33-67':
      return [33, 67]
    case 'double-67-33':
      return [67, 33]
  }
}

export type GenerateOptions = {
  subject?: string
  preheader?: string
}

export const generateHtml = (doc: ComposerDocument, options: GenerateOptions = {}): string => {
  const subject = escapeHtml(options.subject ?? '')
  const preheader = options.preheader ? renderPreheader(options.preheader) : ''
  const blocks = doc.blocks.map((b) => renderBlock(b, doc)).join('\n')
  const footer = renderFooter(doc.footer)
  const bodyStyle = renderStyle({
    margin: 0,
    padding: 0,
    backgroundColor: doc.styles.backgroundColor,
    fontFamily: doc.styles.fontFamily,
  })
  const wrapperStyle = renderStyle({
    width: '100%',
    backgroundColor: doc.styles.backgroundColor,
    margin: 0,
    padding: 0,
  })
  const contentStyle = renderStyle({
    width: doc.styles.contentWidth,
    backgroundColor: doc.styles.contentBackground,
    margin: '0 auto',
  })

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: inherit; }
    @media only screen and (max-width: 620px) {
      .cs-content { width: 100% !important; }
      .cs-cell { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="${bodyStyle}">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${wrapperStyle}">
    <tr>
      <td align="center">
        <table role="presentation" class="cs-content" cellpadding="0" cellspacing="0" border="0" width="${doc.styles.contentWidth}" style="${contentStyle}">
${indent(blocks, 10)}
${indent(footer, 10)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const renderPreheader = (preheader: string): string => {
  const style = renderStyle({
    display: 'none',
    overflow: 'hidden',
    lineHeight: 1,
    opacity: 0,
    maxHeight: 0,
    maxWidth: 0,
    fontSize: 1,
  })
  return `<div style="${style}">${escapeHtml(preheader)}</div>`
}

const renderBlock = (block: Block, doc: ComposerDocument): string => {
  const blockTdStyle = renderStyle({
    background: block.background,
    paddingTop: block.paddingY,
    paddingBottom: block.paddingY,
    paddingLeft: block.paddingX,
    paddingRight: block.paddingX,
  })
  const percents = layoutToColumnPercents(block.layout)
  const innerWidth = doc.styles.contentWidth - block.paddingX * 2
  const cells = block.cells
    .map((cell, idx) => renderCell(cell, percents[idx], innerWidth))
    .join('\n')

  return `<tr>
  <td style="${blockTdStyle}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
${indent(cells, 8)}
      </tr>
    </table>
  </td>
</tr>`
}

const renderCell = (cell: Cell, percent: number, contentWidth: number): string => {
  const cellStyle = renderStyle({
    verticalAlign: 'top',
    width: `${percent}%`,
  })
  const cellWidth = Math.floor((contentWidth * percent) / 100)
  const elements = cell.elements.map((el) => renderElement(el, cellWidth)).join('\n')
  return `<td class="cs-cell" valign="top" style="${cellStyle}">
${indent(elements, 2)}
</td>`
}

const renderElement = (element: ComposerElement, cellWidth: number): string => {
  switch (element.type) {
    case 'text':
      return renderText(element)
    case 'image':
      return renderImage(element, cellWidth)
    case 'button':
      return renderButton(element)
    case 'divider':
      return renderDivider(element)
    case 'spacer':
      return renderSpacer(element)
  }
}

const renderText = (element: TextElement): string => {
  const wrapStyle = renderStyle({
    paddingTop: element.paddingY,
    paddingBottom: element.paddingY,
    paddingLeft: element.paddingX,
    paddingRight: element.paddingX,
    fontSize: 14,
    lineHeight: 1.6,
    color: '#1f2937',
  })
  return `<div style="${wrapStyle}">${element.html}</div>`
}

const renderImage = (element: ImageElement, cellWidth: number): string => {
  const align: 'left' | 'right' | 'center' = element.alignment
  const innerWidth = Math.floor(((cellWidth - element.paddingX * 2) * element.widthPct) / 100)
  const wrapStyle = renderStyle({
    paddingTop: element.paddingY,
    paddingBottom: element.paddingY,
    paddingLeft: element.paddingX,
    paddingRight: element.paddingX,
    textAlign: align,
  })
  const imgStyle = renderStyle({
    display: 'block',
    width: innerWidth,
    height: 'auto',
    maxWidth: '100%',
    margin: align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '0',
  })
  const img = `<img src="${escapeAttr(element.src)}" alt="${escapeAttr(element.alt)}" width="${innerWidth}" style="${imgStyle}" />`
  const linked = element.href
    ? `<a href="${escapeAttr(element.href)}" target="_blank" rel="noreferrer">${img}</a>`
    : img
  return `<div style="${wrapStyle}">${linked}</div>`
}

const renderButton = (element: ButtonElement): string => {
  const align = element.alignment
  const wrapStyle = renderStyle({
    paddingTop: element.marginY,
    paddingBottom: element.marginY,
    textAlign: align,
  })
  const buttonStyle = renderStyle({
    display: 'inline-block',
    background: element.background,
    color: element.textColor,
    borderRadius: element.borderRadius,
    paddingTop: element.paddingY,
    paddingBottom: element.paddingY,
    paddingLeft: element.paddingX,
    paddingRight: element.paddingX,
    fontWeight: element.fontWeight,
    fontSize: 14,
    textDecoration: 'none',
    lineHeight: 1,
    msoLineHeightRule: 'exactly',
  })
  return `<div style="${wrapStyle}">
  <a href="${escapeAttr(element.href || '#')}" target="_blank" rel="noreferrer" style="${buttonStyle}">${escapeHtml(element.label)}</a>
</div>`
}

const renderDivider = (element: DividerElement): string => {
  const wrapStyle = renderStyle({
    paddingTop: element.paddingY,
    paddingBottom: element.paddingY,
  })
  const hrStyle = renderStyle({
    border: 0,
    borderTop: `${element.thickness}px solid ${element.color}`,
    margin: 0,
    height: 0,
  })
  return `<div style="${wrapStyle}"><hr style="${hrStyle}" /></div>`
}

const renderSpacer = (element: SpacerElement): string => {
  const style = renderStyle({
    height: element.height,
    lineHeight: `${element.height}px`,
    fontSize: 1,
  })
  return `<div style="${style}">&nbsp;</div>`
}

const renderFooter = (footer: FooterBlock): string => {
  const tdStyle = renderStyle({
    background: footer.background,
    color: footer.textColor,
    padding: '24px 32px',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 1.6,
  })
  const linkStyle = renderStyle({
    color: 'inherit',
    textDecoration: 'underline',
  })
  const unsubscribe = footer.showUnsubscribe
    ? `<div><a href="{{unsubscribeUrl}}" style="${linkStyle}">${escapeHtml(footer.unsubscribeLabel)}</a></div>`
    : ''
  return `<tr>
  <td style="${tdStyle}">
    <div style="margin-bottom: 8px;">${escapeHtml(footer.helperText)}</div>
    <div style="margin-bottom: 12px; opacity: 0.8;">${escapeHtml(footer.businessName)} &middot; ${escapeHtml(footer.businessAddress)}</div>
    ${unsubscribe}
  </td>
</tr>`
}

const indent = (s: string, n: number): string => {
  const pad = ' '.repeat(n)
  return s
    .split('\n')
    .map((line) => (line.length ? pad + line : line))
    .join('\n')
}
