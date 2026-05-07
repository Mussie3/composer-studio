import {
  createBlock,
  createButtonElement,
  createCell,
  createDividerElement,
  createEmptyDocument,
  createImageElement,
  createSpacerElement,
  createTextElement,
} from '@domains/mail/factories'
import type {
  Block,
  BlockLayout,
  Cell,
  ComposerDocument,
  ComposerElement,
} from '@domains/mail/types'

export type ParseResult =
  | { ok: true; document: ComposerDocument }
  | { ok: false; error: string }

export const parseHtml = (raw: string): ParseResult => {
  if (!raw.trim()) return { ok: false, error: 'Nothing to import.' }

  let dom: Document
  try {
    dom = new DOMParser().parseFromString(raw, 'text/html')
  } catch (err) {
    return { ok: false, error: `Could not parse HTML: ${(err as Error).message}` }
  }

  const content = dom.querySelector<HTMLTableElement>('table.cs-content')
  if (!content) {
    return tryGenericRecovery(dom)
  }

  const doc = createEmptyDocument()

  const contentStyle = parseStyle(content.getAttribute('style'))
  const widthAttr = content.getAttribute('width')
  if (widthAttr && /^\d+$/.test(widthAttr)) {
    doc.styles.contentWidth = parseInt(widthAttr, 10)
  } else if (contentStyle.width) {
    doc.styles.contentWidth = parsePx(contentStyle.width) ?? doc.styles.contentWidth
  }
  if (contentStyle.background || contentStyle['background-color']) {
    doc.styles.contentBackground = contentStyle.background || contentStyle['background-color']
  }
  const bodyStyle = parseStyle(dom.body.getAttribute('style'))
  if (bodyStyle.background || bodyStyle['background-color']) {
    doc.styles.backgroundColor = bodyStyle.background || bodyStyle['background-color']
  }

  const rows = Array.from(content.querySelectorAll(':scope > tbody > tr, :scope > tr'))

  const blocks: Block[] = []
  rows.forEach((tr, idx) => {
    const td = tr.querySelector<HTMLTableCellElement>(':scope > td')
    if (!td) return
    // Footer = last row with no nested layout table
    const innerTable = td.querySelector(':scope > table')
    if (!innerTable && idx === rows.length - 1) {
      hydrateFooter(doc, td)
      return
    }
    const block = parseBlock(td, innerTable as HTMLTableElement | null)
    if (block) blocks.push(block)
  })

  doc.blocks = blocks

  // Light validation
  if (doc.blocks.length === 0) {
    // Fall back to generic recovery so the user gets *something*.
    const recovered = tryGenericRecovery(dom)
    if (recovered.ok) return recovered
    return { ok: false, error: 'No blocks found in the imported HTML.' }
  }

  return { ok: true, document: doc }
}

const tryGenericRecovery = (dom: Document): ParseResult => {
  const html = dom.body?.innerHTML?.trim()
  if (!html) {
    return { ok: false, error: 'No <body> content found.' }
  }
  const doc = createEmptyDocument()
  doc.blocks = [
    {
      ...createBlock('single'),
      cells: [createCell([createTextElement({ html })])],
    },
  ]
  return { ok: true, document: doc }
}

const parseBlock = (td: HTMLTableCellElement, layoutTable: HTMLTableElement | null): Block | null => {
  const tdStyle = parseStyle(td.getAttribute('style'))
  const block = createBlock('single')
  block.background = tdStyle.background || tdStyle['background-color'] || block.background
  block.paddingY = parsePx(tdStyle['padding-top']) ?? parsePx(tdStyle.padding) ?? block.paddingY
  block.paddingX = parsePx(tdStyle['padding-left']) ?? parsePx(tdStyle.padding) ?? block.paddingX

  if (!layoutTable) {
    // Block with no nested layout table — treat as single column with raw children
    const cell = parseCellChildren(td)
    block.layout = 'single'
    block.cells = [cell]
    return block
  }

  const cellTds = Array.from(
    layoutTable.querySelectorAll<HTMLTableCellElement>(':scope > tbody > tr > td, :scope > tr > td'),
  )
  if (cellTds.length === 0) return null

  const widths = cellTds.map((c) => {
    const s = parseStyle(c.getAttribute('style'))
    return parsePercent(s.width)
  })

  block.layout = layoutFromWidths(widths)
  block.cells = cellTds.map(parseCellChildren)
  return block
}

const parseCellChildren = (host: Element): Cell => {
  const cell = createCell()
  // Walk the element children of the host (cell <td> or block <td> for single-column fallback)
  Array.from(host.children).forEach((child) => {
    const el = parseElement(child as HTMLElement)
    if (el) cell.elements.push(el)
  })
  // If we found nothing but there's text content, wrap it as a text element.
  if (cell.elements.length === 0 && host.textContent?.trim()) {
    cell.elements.push(createTextElement({ html: host.innerHTML }))
  }
  return cell
}

const parseElement = (node: HTMLElement): ComposerElement | null => {
  // Spacer: explicit height + non-breaking space
  const style = parseStyle(node.getAttribute('style'))
  const height = parsePx(style.height)
  if (height && (node.textContent?.replace(/\s/g, '') === '' || / |&nbsp;/.test(node.innerHTML))) {
    return createSpacerElement({ height })
  }

  // Divider
  const hr = node.querySelector('hr')
  if (hr) {
    const hrStyle = parseStyle(hr.getAttribute('style'))
    const borderTop = hrStyle['border-top'] || ''
    const m = borderTop.match(/(\d+)px\s+\w+\s+(.+)/)
    return createDividerElement({
      thickness: m ? parseInt(m[1], 10) : 1,
      color: m ? m[2].trim() : '#e5e7eb',
      paddingY: parsePx(style['padding-top']) ?? 12,
    })
  }

  // Image (possibly wrapped in <a>)
  const img = node.querySelector<HTMLImageElement>('img')
  if (img) {
    const widthAttr = img.getAttribute('width')
    const imgStyle = parseStyle(img.getAttribute('style'))
    const aWrap = node.querySelector<HTMLAnchorElement>('a')
    const align = parseAlign(style['text-align']) ?? 'center'
    const widthFromStyle = parsePx(imgStyle.width)
    const widthFromAttr = widthAttr && /^\d+$/.test(widthAttr) ? parseInt(widthAttr, 10) : null
    const containerWidth = parsePx(parseStyle(node.getAttribute('style')).width) ?? null
    return createImageElement({
      src: img.getAttribute('src') ?? '',
      alt: img.getAttribute('alt') ?? '',
      alignment: align,
      widthPct: widthFromStyle && containerWidth ? clamp(Math.round((widthFromStyle / containerWidth) * 100), 10, 100) : 100,
      href: aWrap?.getAttribute('href') ?? '',
      paddingX: parsePx(style['padding-left']) ?? parsePx(style.padding) ?? 24,
      paddingY: parsePx(style['padding-top']) ?? parsePx(style.padding) ?? 12,
      ...(widthFromAttr && !widthFromStyle ? { widthPct: 100 } : {}),
    })
  }

  // Button: <a> with display: inline-block + background
  const a = node.querySelector<HTMLAnchorElement>('a')
  if (a) {
    const aStyle = parseStyle(a.getAttribute('style'))
    if (aStyle.display === 'inline-block' || aStyle.background || aStyle['background-color']) {
      return createButtonElement({
        label: a.textContent ?? 'Click me',
        href: a.getAttribute('href') ?? '',
        alignment: parseAlign(style['text-align']) ?? 'center',
        background: aStyle.background || aStyle['background-color'] || '#3a6df0',
        textColor: aStyle.color ?? '#ffffff',
        borderRadius: parsePx(aStyle['border-radius']) ?? 6,
        paddingX: parsePx(aStyle['padding-left']) ?? 24,
        paddingY: parsePx(aStyle['padding-top']) ?? 12,
        marginY: parsePx(style['padding-top']) ?? 12,
        fontWeight: parseInt(aStyle['font-weight'] ?? '600', 10),
      })
    }
  }

  // Default: text element wrapping inner HTML, dropping outer padding wrapper
  if (node.tagName === 'DIV' || node.tagName === 'P' || /^H[1-6]$/.test(node.tagName)) {
    return createTextElement({
      html: node.tagName === 'DIV' ? node.innerHTML : node.outerHTML,
      paddingX: parsePx(style['padding-left']) ?? parsePx(style.padding) ?? 24,
      paddingY: parsePx(style['padding-top']) ?? parsePx(style.padding) ?? 12,
    })
  }

  return null
}

const hydrateFooter = (doc: ComposerDocument, td: HTMLTableCellElement) => {
  const style = parseStyle(td.getAttribute('style'))
  doc.footer.background = style.background || style['background-color'] || doc.footer.background
  doc.footer.textColor = style.color || doc.footer.textColor

  const divs = Array.from(td.querySelectorAll(':scope > div'))
  const helper = divs[0]?.textContent?.trim()
  const meta = divs[1]?.textContent?.trim()
  if (helper) doc.footer.helperText = helper
  if (meta) {
    const [name, ...rest] = meta.split('·').map((s) => s.trim())
    if (name) doc.footer.businessName = name
    if (rest.length) doc.footer.businessAddress = rest.join(', ')
  }
  const link = td.querySelector('a')
  doc.footer.showUnsubscribe = !!link
  if (link?.textContent) doc.footer.unsubscribeLabel = link.textContent.trim()
}

// ---- helpers ----

const parseStyle = (raw: string | null): Record<string, string> => {
  if (!raw) return {}
  return raw
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, decl) => {
      const idx = decl.indexOf(':')
      if (idx <= 0) return acc
      acc[decl.slice(0, idx).trim().toLowerCase()] = decl.slice(idx + 1).trim()
      return acc
    }, {})
}

const parsePx = (v: string | undefined): number | null => {
  if (!v) return null
  const m = String(v).match(/-?\d+(?:\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

const parsePercent = (v: string | undefined): number | null => {
  if (!v) return null
  const m = String(v).match(/-?\d+(?:\.\d+)?/)
  if (!m) return null
  return /%$/.test(v) ? parseFloat(m[0]) : null
}

const parseAlign = (v: string | undefined): 'left' | 'center' | 'right' | null => {
  if (!v) return null
  const lower = v.toLowerCase()
  if (lower.includes('left')) return 'left'
  if (lower.includes('right')) return 'right'
  if (lower.includes('center')) return 'center'
  return null
}

const layoutFromWidths = (widths: (number | null)[]): BlockLayout => {
  const valid = widths.map((w) => w ?? 50)
  if (valid.length <= 1) return 'single'
  const [first, second] = valid
  const ratio = first / (first + second)
  if (Math.abs(ratio - 0.5) < 0.08) return 'double-50-50'
  if (ratio < 0.5) return 'double-33-67'
  return 'double-67-33'
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
