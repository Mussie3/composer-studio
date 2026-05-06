import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useAppDispatch, useAppSelector } from '@app/hooks'
import {
  selectBlocks,
  selectDocumentStyles,
  selectFooter,
  selectViewMode,
} from '@domains/mail/store/composer/composer.selectors'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import CanvasBlock from './CanvasBlock'
import CanvasFooter from './CanvasFooter'
import EmptyCanvas from './EmptyCanvas'

export default function Canvas() {
  const blocks = useAppSelector(selectBlocks)
  const styles = useAppSelector(selectDocumentStyles)
  const footer = useAppSelector(selectFooter)
  const viewMode = useAppSelector(selectViewMode)
  const dispatch = useAppDispatch()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = blocks.findIndex((b) => b.id === active.id)
    const to = blocks.findIndex((b) => b.id === over.id)
    if (from < 0 || to < 0) return
    arrayMove(blocks, from, to)
    dispatch(composerActions.moveBlock({ from, to }))
  }

  const width = viewMode === 'mobile' ? 380 : styles.contentWidth

  return (
    <div
      className="h-full overflow-auto"
      style={{ background: styles.backgroundColor }}
      onClick={() => dispatch(composerActions.setSelection({ kind: 'document' }))}
    >
      <div className="py-10 flex flex-col items-center">
        <div
          className="shadow-sm transition-all"
          style={{
            width,
            background: styles.contentBackground,
            fontFamily: styles.fontFamily,
          }}
        >
          {blocks.length === 0 ? (
            <EmptyCanvas />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((block) => (
                  <CanvasBlock key={block.id} block={block} />
                ))}
              </SortableContext>
            </DndContext>
          )}
          <CanvasFooter footer={footer} />
        </div>
      </div>
    </div>
  )
}
