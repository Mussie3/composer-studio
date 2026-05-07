import { Copy, Trash2, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Block } from '@domains/mail/types'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import { selectSelection } from '@domains/mail/store/composer/composer.selectors'
import { cx } from '@shared/utils/cx'
import CanvasElement from './CanvasElement'

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
  block: Block
}

export default function CanvasBlock({ block }: Props) {
  const dispatch = useAppDispatch()
  const selection = useAppSelector(selectSelection)
  const isSelected = selection?.kind === 'block' && selection.blockId === block.id

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: block.background,
    paddingTop: block.paddingY,
    paddingBottom: block.paddingY,
    paddingLeft: block.paddingX,
    paddingRight: block.paddingX,
  }

  const select = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(composerActions.setSelection({ kind: 'block', blockId: block.id }))
  }

  const sizes = layoutToColumnSizes(block.layout)
  const totalUnits = sizes.reduce((a, b) => a + b, 0)

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={select}
      className={cx(
        'relative group',
        isSelected && 'outline outline-2 outline-brand-500 -outline-offset-2',
        !isSelected && 'hover:outline hover:outline-1 hover:outline-brand-500/30 hover:-outline-offset-1',
      )}
    >
      {/* Block toolbar */}
      <div className="absolute -left-9 top-2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition">
        <button
          {...attributes}
          {...listeners}
          className="w-7 h-7 grid place-items-center rounded bg-white shadow border border-ink-100 text-ink-500 hover:text-ink-800 cursor-grab"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      </div>
      <div className={cx('absolute -right-9 top-2 flex-col gap-1 transition', isSelected ? 'flex' : 'hidden group-hover:flex')}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            dispatch(composerActions.duplicateBlock({ blockId: block.id }))
          }}
          className="w-7 h-7 grid place-items-center rounded bg-white shadow border border-ink-100 text-ink-500 hover:text-ink-800"
          title="Duplicate"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            dispatch(composerActions.removeBlock({ blockId: block.id }))
          }}
          className="w-7 h-7 grid place-items-center rounded bg-white shadow border border-ink-100 text-ink-500 hover:text-red-600"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {block.cells.map((cell, idx) => {
          const flex = sizes[idx] / totalUnits
          return (
            <div
              key={cell.id}
              style={{ flex: `${flex} 1 0`, minWidth: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                dispatch(composerActions.setSelection({ kind: 'cell', blockId: block.id, cellId: cell.id }))
              }}
            >
              {cell.elements.length === 0 ? (
                <div className="text-xs text-ink-400 border border-dashed border-ink-100 rounded p-6 text-center">
                  Empty column · select to add elements
                </div>
              ) : (
                cell.elements.map((el) => (
                  <CanvasElement key={el.id} blockId={block.id} cellId={cell.id} element={el} />
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
