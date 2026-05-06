import { Plus, Type, Image as ImageIcon, MousePointerClick, Minus, Move3d } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { selectBlocks, selectSelection } from '@domains/mail/store/composer/composer.selectors'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import type { BlockLayout, ElementKind } from '@domains/mail/types'
import { cx } from '@shared/utils/cx'

const layouts: { id: BlockLayout; label: string; preview: string }[] = [
  { id: 'single', label: '1 column', preview: 'grid-cols-[1fr]' },
  { id: 'double-50-50', label: '2 equal', preview: 'grid-cols-[1fr_1fr]' },
  { id: 'double-33-67', label: '1 : 2', preview: 'grid-cols-[1fr_2fr]' },
  { id: 'double-67-33', label: '2 : 1', preview: 'grid-cols-[2fr_1fr]' },
]

const elementOptions: { kind: ElementKind; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { kind: 'text', label: 'Text', icon: Type },
  { kind: 'image', label: 'Image', icon: ImageIcon },
  { kind: 'button', label: 'Button', icon: MousePointerClick },
  { kind: 'divider', label: 'Divider', icon: Minus },
  { kind: 'spacer', label: 'Spacer', icon: Move3d },
]

const blockSummary = (layout: BlockLayout) =>
  layout === 'single' ? '1 column' : layout.replace('double-', '').replace('-', ' : ') + ' columns'

export default function NavigationPanel() {
  const blocks = useAppSelector(selectBlocks)
  const selection = useAppSelector(selectSelection)
  const dispatch = useAppDispatch()

  const selectedCellId =
    selection?.kind === 'cell'
      ? selection.cellId
      : selection?.kind === 'element'
        ? selection.cellId
        : null
  const selectedBlockId =
    selection && 'blockId' in selection ? selection.blockId : null

  return (
    <aside className="w-72 border-r border-canvas-border bg-canvas-panel flex flex-col">
      <div className="p-4 border-b border-canvas-border">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Add a block
        </div>
        <div className="grid grid-cols-2 gap-2">
          {layouts.map((l) => (
            <button
              key={l.id}
              onClick={() => dispatch(composerActions.addBlock({ layout: l.id }))}
              className="border border-canvas-border rounded-md p-2 text-xs text-gray-700 hover:border-brand-500 hover:bg-brand-50 transition"
            >
              <div className={cx('grid gap-0.5 mb-1', l.preview)}>
                <span className="h-5 bg-gray-100 rounded-sm" />
                {l.id !== 'single' && <span className="h-5 bg-gray-100 rounded-sm" />}
              </div>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {selectedCellId && selectedBlockId && (
        <div className="p-4 border-b border-canvas-border">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Add to selected column
          </div>
          <div className="grid grid-cols-2 gap-2">
            {elementOptions.map((e) => (
              <button
                key={e.kind}
                onClick={() =>
                  dispatch(
                    composerActions.addElement({
                      blockId: selectedBlockId,
                      cellId: selectedCellId,
                      kind: e.kind,
                    }),
                  )
                }
                className="flex items-center gap-2 border border-canvas-border rounded-md px-3 py-2 text-xs text-gray-700 hover:border-brand-500 hover:bg-brand-50 transition"
              >
                <e.icon size={14} />
                {e.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
          Outline
        </div>
        <div className="space-y-1">
          {blocks.map((block, idx) => {
            const isSel = selectedBlockId === block.id
            return (
              <button
                key={block.id}
                onClick={() => dispatch(composerActions.setSelection({ kind: 'block', blockId: block.id }))}
                className={cx(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition flex items-center gap-2',
                  isSel ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                <span className="text-gray-400 text-xs w-4">{idx + 1}</span>
                <span className="flex-1 truncate">{blockSummary(block.layout)}</span>
                <span className="text-xs text-gray-400">
                  {block.cells.reduce((acc, c) => acc + c.elements.length, 0)} els
                </span>
              </button>
            )
          })}
          {blocks.length === 0 && (
            <div className="text-xs text-gray-400 px-3 py-6 text-center border border-dashed border-canvas-border rounded">
              No blocks yet — add one above.
            </div>
          )}
        </div>
      </div>
      <div className="p-3 border-t border-canvas-border">
        <button
          onClick={() => dispatch(composerActions.addBlock({ layout: 'single' }))}
          className="btn-outline w-full justify-center"
        >
          <Plus size={14} /> Append block
        </button>
      </div>
    </aside>
  )
}
