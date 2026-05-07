import {
  Plus,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  Minus,
  Move3d,
  Sparkles,
  Layers,
  GripVertical,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { selectBlocks, selectSelection } from '@domains/mail/store/composer/composer.selectors'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import type { BlockLayout, ElementKind } from '@domains/mail/types'
import { cx } from '@shared/utils/cx'

const layouts: { id: BlockLayout; label: string; cols: 1 | 2; ratio: [number, number] }[] = [
  { id: 'single', label: '1 column', cols: 1, ratio: [1, 0] },
  { id: 'double-50-50', label: '2 equal', cols: 2, ratio: [1, 1] },
  { id: 'double-33-67', label: '1 : 2', cols: 2, ratio: [1, 2] },
  { id: 'double-67-33', label: '2 : 1', cols: 2, ratio: [2, 1] },
]

type ElementOpt = {
  kind: ElementKind
  label: string
  description: string
  icon: React.ComponentType<{ size?: number }>
  tile: string
}

const elementOptions: ElementOpt[] = [
  { kind: 'text', label: 'Text', description: 'Rich text block', icon: Type, tile: 'tile-text' },
  { kind: 'image', label: 'Image', description: 'Visual media', icon: ImageIcon, tile: 'tile-image' },
  { kind: 'button', label: 'Button', description: 'Call to action', icon: MousePointerClick, tile: 'tile-button' },
  { kind: 'divider', label: 'Divider', description: 'Horizontal line', icon: Minus, tile: 'tile-divider' },
  { kind: 'spacer', label: 'Spacer', description: 'Vertical space', icon: Move3d, tile: 'tile-spacer' },
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
  const selectedBlockId = selection && 'blockId' in selection ? selection.blockId : null

  return (
    <aside className="w-72 shrink-0 border-r border-ink-100 bg-surface-panel/80 backdrop-blur flex flex-col scrollbar-thin">
      {/* Components header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display font-semibold text-ink-900 text-base">Components</h2>
          <span className="text-[10px] text-ink-400 uppercase tracking-wider">Drag &amp; drop</span>
        </div>
        <p className="text-xs text-ink-500">Pick a layout, then add elements.</p>
      </div>

      {/* Layout cards */}
      <div className="px-4 pb-4">
        <div className="section-title mb-2">Layouts</div>
        <div className="grid grid-cols-2 gap-2">
          {layouts.map((l) => (
            <button
              key={l.id}
              onClick={() => dispatch(composerActions.addBlock({ layout: l.id }))}
              className="layout-card group"
              title={`Add a ${l.label.toLowerCase()} block`}
            >
              <div
                className={cx(
                  'grid gap-1 mb-2',
                  l.cols === 1 ? 'grid-cols-[1fr]' : 'grid-cols-2',
                )}
              >
                {l.cols === 1 ? (
                  <span className="h-6 rounded-md bg-gradient-to-br from-brand-100 to-brand-200/60" />
                ) : (
                  <>
                    <span
                      className="h-6 rounded-md bg-gradient-to-br from-brand-100 to-brand-200/60"
                      style={{ flex: l.ratio[0] }}
                    />
                    <span
                      className="h-6 rounded-md bg-gradient-to-br from-brand-100 to-brand-200/60"
                      style={{ flex: l.ratio[1] }}
                    />
                  </>
                )}
              </div>
              <div className="font-medium text-ink-700 group-hover:text-brand-700">{l.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Element tiles */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Elements</div>
          {!selectedCellId && (
            <span className="text-[10px] text-ink-400">Select a column</span>
          )}
        </div>
        <div className="space-y-1.5">
          {elementOptions.map((e) => {
            const disabled = !selectedCellId || !selectedBlockId
            return (
              <button
                key={e.kind}
                disabled={disabled}
                onClick={() =>
                  selectedBlockId &&
                  selectedCellId &&
                  dispatch(
                    composerActions.addElement({
                      blockId: selectedBlockId,
                      cellId: selectedCellId,
                      kind: e.kind,
                    }),
                  )
                }
                className={cx(
                  'group w-full flex items-center gap-3 p-2.5 rounded-xl border border-ink-100 bg-surface-panel transition-all text-left',
                  disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-soft',
                )}
              >
                <span className={cx('tile w-9 h-9 shrink-0', e.tile)}>
                  <e.icon size={16} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-ink-900 leading-tight">
                    {e.label}
                  </span>
                  <span className="block text-[11px] text-ink-500 mt-0.5">{e.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Outline */}
      <div className="flex-1 overflow-auto px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Outline</div>
          <span className="text-[10px] text-ink-400">{blocks.length} block{blocks.length === 1 ? '' : 's'}</span>
        </div>
        <div className="space-y-1">
          {blocks.map((block) => {
            const isSel = selectedBlockId === block.id
            return (
              <button
                key={block.id}
                onClick={() =>
                  dispatch(composerActions.setSelection({ kind: 'block', blockId: block.id }))
                }
                className={cx(
                  'w-full text-left px-2.5 py-2 rounded-lg text-sm transition-all flex items-center gap-2',
                  isSel
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'text-ink-600 hover:bg-ink-50',
                )}
              >
                <GripVertical
                  size={13}
                  className={isSel ? 'text-white/80' : 'text-ink-300'}
                />
                <Layers size={13} className={isSel ? 'text-white/80' : 'text-ink-400'} />
                <span className="flex-1 truncate text-[13px]">{blockSummary(block.layout)}</span>
                <span
                  className={cx(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    isSel ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-500',
                  )}
                >
                  {block.cells.reduce((acc, c) => acc + c.elements.length, 0)}
                </span>
              </button>
            )
          })}
          {blocks.length === 0 && (
            <div className="text-xs text-ink-400 px-3 py-6 text-center border border-dashed border-ink-200 rounded-lg">
              No blocks yet — pick a layout above.
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => dispatch(composerActions.addBlock({ layout: 'single' }))}
          className="btn-outline w-full justify-center"
        >
          <Plus size={14} /> Append block
        </button>
      </div>

      {/* Pro tip */}
      <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/40 border border-brand-100">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="tile w-5 h-5 tile-brand">
            <Sparkles size={11} />
          </span>
          <span className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider">
            Pro tip
          </span>
        </div>
        <p className="text-[11px] text-ink-600 leading-relaxed">
          Click an element to edit it inline. Use the right panel to tweak spacing,
          colors, and alignment.
        </p>
      </div>
    </aside>
  )
}
