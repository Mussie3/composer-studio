import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuid } from 'uuid'
import {
  createBlock,
  createCell,
  createElement,
  createSeedDocument,
} from '@domains/mail/factories'
import type {
  Block,
  BlockLayout,
  ComposerDocument,
  ComposerElement,
  DocumentStyles,
  ElementKind,
  FooterBlock,
  Selection,
  ViewMode,
} from '@domains/mail/types'

export type ComposerState = {
  mailId: string | null
  mailTitle: string
  document: ComposerDocument
  selection: Selection | null
  viewMode: ViewMode
  zoom: number
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  past: ComposerDocument[]
  future: ComposerDocument[]
}

const initialState: ComposerState = {
  mailId: null,
  mailTitle: 'Untitled email',
  document: createSeedDocument(),
  selection: null,
  viewMode: 'desktop',
  zoom: 1,
  isLoading: false,
  isSaving: false,
  isDirty: false,
  past: [],
  future: [],
}

const findBlockIndex = (state: ComposerState, blockId: string) =>
  state.document.blocks.findIndex((b) => b.id === blockId)

const findCell = (state: ComposerState, blockId: string, cellId: string) => {
  const block = state.document.blocks.find((b) => b.id === blockId)
  return block?.cells.find((c) => c.id === cellId)
}

const findElement = (
  state: ComposerState,
  blockId: string,
  cellId: string,
  elementId: string,
) => {
  const cell = findCell(state, blockId, cellId)
  return cell?.elements.find((e) => e.id === elementId)
}

const pushHistory = (state: ComposerState) => {
  state.past.push(JSON.parse(JSON.stringify(state.document)))
  if (state.past.length > 50) state.past.shift()
  state.future = []
  state.isDirty = true
}

const cellsForLayout = (layout: BlockLayout) => (layout === 'single' ? 1 : 2)

export const composerSlice = createSlice({
  name: 'composer',
  initialState,
  reducers: {
    loadDocument(
      state,
      action: PayloadAction<{ mailId: string; title: string; document: ComposerDocument }>,
    ) {
      state.mailId = action.payload.mailId
      state.mailTitle = action.payload.title
      state.document = action.payload.document
      state.selection = null
      state.past = []
      state.future = []
      state.isDirty = false
      state.isLoading = false
    },
    resetDocument(state) {
      pushHistory(state)
      state.document = createSeedDocument()
      state.selection = null
    },
    replaceDocument(state, action: PayloadAction<ComposerDocument>) {
      pushHistory(state)
      state.document = action.payload
      state.selection = null
    },
    setMailTitle(state, action: PayloadAction<string>) {
      state.mailTitle = action.payload
      state.isDirty = true
    },
    setSelection(state, action: PayloadAction<Selection | null>) {
      state.selection = action.payload
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload
    },
    setZoom(state, action: PayloadAction<number>) {
      state.zoom = action.payload
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setIsSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload
    },
    markSaved(state) {
      state.isDirty = false
      state.isSaving = false
    },

    addBlock(
      state,
      action: PayloadAction<{ layout: BlockLayout; index?: number }>,
    ) {
      pushHistory(state)
      const block = createBlock(action.payload.layout)
      const index = action.payload.index ?? state.document.blocks.length
      state.document.blocks.splice(index, 0, block)
      state.selection = { kind: 'block', blockId: block.id }
    },
    removeBlock(state, action: PayloadAction<{ blockId: string }>) {
      pushHistory(state)
      state.document.blocks = state.document.blocks.filter(
        (b) => b.id !== action.payload.blockId,
      )
      if (state.selection?.kind === 'block' && state.selection.blockId === action.payload.blockId) {
        state.selection = null
      }
    },
    duplicateBlock(state, action: PayloadAction<{ blockId: string }>) {
      pushHistory(state)
      const idx = findBlockIndex(state, action.payload.blockId)
      if (idx === -1) return
      const original = state.document.blocks[idx]
      const clone: Block = JSON.parse(JSON.stringify(original))
      clone.id = uuid()
      clone.cells = clone.cells.map((c) => ({
        ...c,
        id: uuid(),
        elements: c.elements.map((e) => ({ ...e, id: uuid() })),
      }))
      state.document.blocks.splice(idx + 1, 0, clone)
      state.selection = { kind: 'block', blockId: clone.id }
    },
    moveBlock(state, action: PayloadAction<{ from: number; to: number }>) {
      pushHistory(state)
      const { from, to } = action.payload
      const [moved] = state.document.blocks.splice(from, 1)
      state.document.blocks.splice(to, 0, moved)
    },
    updateBlock(
      state,
      action: PayloadAction<{ blockId: string; patch: Partial<Omit<Block, 'id' | 'cells'>> }>,
    ) {
      pushHistory(state)
      const block = state.document.blocks.find((b) => b.id === action.payload.blockId)
      if (block) Object.assign(block, action.payload.patch)
    },
    changeBlockLayout(
      state,
      action: PayloadAction<{ blockId: string; layout: BlockLayout }>,
    ) {
      pushHistory(state)
      const block = state.document.blocks.find((b) => b.id === action.payload.blockId)
      if (!block) return
      const targetCount = cellsForLayout(action.payload.layout)
      block.layout = action.payload.layout
      if (block.cells.length < targetCount) {
        while (block.cells.length < targetCount) block.cells.push(createCell())
      } else if (block.cells.length > targetCount) {
        const merged = block.cells.flatMap((c) => c.elements)
        block.cells = [createCell(merged)]
        while (block.cells.length < targetCount) block.cells.push(createCell())
      }
    },

    addElement(
      state,
      action: PayloadAction<{
        blockId: string
        cellId: string
        kind: ElementKind
        index?: number
      }>,
    ) {
      pushHistory(state)
      const cell = findCell(state, action.payload.blockId, action.payload.cellId)
      if (!cell) return
      const element = createElement(action.payload.kind)
      const index = action.payload.index ?? cell.elements.length
      cell.elements.splice(index, 0, element)
      state.selection = {
        kind: 'element',
        blockId: action.payload.blockId,
        cellId: action.payload.cellId,
        elementId: element.id,
      }
    },
    removeElement(
      state,
      action: PayloadAction<{ blockId: string; cellId: string; elementId: string }>,
    ) {
      pushHistory(state)
      const cell = findCell(state, action.payload.blockId, action.payload.cellId)
      if (!cell) return
      cell.elements = cell.elements.filter((e) => e.id !== action.payload.elementId)
      if (
        state.selection?.kind === 'element' &&
        state.selection.elementId === action.payload.elementId
      ) {
        state.selection = null
      }
    },
    moveElement(
      state,
      action: PayloadAction<{
        blockId: string
        cellId: string
        from: number
        to: number
      }>,
    ) {
      pushHistory(state)
      const cell = findCell(state, action.payload.blockId, action.payload.cellId)
      if (!cell) return
      const { from, to } = action.payload
      const [moved] = cell.elements.splice(from, 1)
      cell.elements.splice(to, 0, moved)
    },
    updateElement(
      state,
      action: PayloadAction<{
        blockId: string
        cellId: string
        elementId: string
        patch: Partial<ComposerElement>
      }>,
    ) {
      pushHistory(state)
      const element = findElement(
        state,
        action.payload.blockId,
        action.payload.cellId,
        action.payload.elementId,
      )
      if (element) Object.assign(element, action.payload.patch)
    },

    updateFooter(state, action: PayloadAction<Partial<FooterBlock>>) {
      pushHistory(state)
      Object.assign(state.document.footer, action.payload)
    },
    updateDocumentStyles(state, action: PayloadAction<Partial<DocumentStyles>>) {
      pushHistory(state)
      Object.assign(state.document.styles, action.payload)
    },

    undo(state) {
      const previous = state.past.pop()
      if (!previous) return
      state.future.push(JSON.parse(JSON.stringify(state.document)))
      state.document = previous
      state.isDirty = true
    },
    redo(state) {
      const next = state.future.pop()
      if (!next) return
      state.past.push(JSON.parse(JSON.stringify(state.document)))
      state.document = next
      state.isDirty = true
    },
  },
})

export const composerActions = composerSlice.actions
export default composerSlice.reducer
