import type { RootState } from '@app/store'

export const selectComposer = (s: RootState) => s.composer
export const selectDocument = (s: RootState) => s.composer.document
export const selectBlocks = (s: RootState) => s.composer.document.blocks
export const selectFooter = (s: RootState) => s.composer.document.footer
export const selectDocumentStyles = (s: RootState) => s.composer.document.styles
export const selectSelection = (s: RootState) => s.composer.selection
export const selectViewMode = (s: RootState) => s.composer.viewMode
export const selectMailTitle = (s: RootState) => s.composer.mailTitle
export const selectIsDirty = (s: RootState) => s.composer.isDirty
export const selectCanUndo = (s: RootState) => s.composer.past.length > 0
export const selectCanRedo = (s: RootState) => s.composer.future.length > 0

export const selectSelectedNode = (s: RootState) => {
  const sel = s.composer.selection
  if (!sel) return null
  if (sel.kind === 'document') return { kind: 'document' as const, styles: s.composer.document.styles }
  if (sel.kind === 'footer') return { kind: 'footer' as const, footer: s.composer.document.footer }
  const block = s.composer.document.blocks.find((b) => b.id === sel.blockId)
  if (!block) return null
  if (sel.kind === 'block') return { kind: 'block' as const, block }
  const cell = block.cells.find((c) => c.id === sel.cellId)
  if (!cell) return null
  if (sel.kind === 'cell') return { kind: 'cell' as const, block, cell }
  const element = cell.elements.find((e) => e.id === sel.elementId)
  if (!element) return null
  return { kind: 'element' as const, block, cell, element }
}
