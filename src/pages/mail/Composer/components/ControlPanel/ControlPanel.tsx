import { useAppDispatch, useAppSelector } from '@app/hooks'
import {
  selectSelectedNode,
} from '@domains/mail/store/composer/composer.selectors'
import { composerActions } from '@domains/mail/store/composer/composer.slice'
import type {
  BlockLayout,
  ButtonElement,
  ComposerElement,
  DividerElement,
  ImageElement,
  SpacerElement,
  TextElement,
} from '@domains/mail/types'
import { Spec, ColorInput, NumberInput, TextInput, SelectInput, ToggleInput } from '../PropertySpecs/Spec'

const layoutOptions: { value: BlockLayout; label: string }[] = [
  { value: 'single', label: '1 column' },
  { value: 'double-50-50', label: '2 equal columns' },
  { value: 'double-33-67', label: '1 : 2 columns' },
  { value: 'double-67-33', label: '2 : 1 columns' },
]

const alignmentOptions = [
  { value: 'left' as const, label: 'Left' },
  { value: 'center' as const, label: 'Center' },
  { value: 'right' as const, label: 'Right' },
]

export default function ControlPanel() {
  const node = useAppSelector(selectSelectedNode)
  const dispatch = useAppDispatch()

  return (
    <aside className="w-80 border-l border-ink-100 bg-surface-panel overflow-auto">
      <div className="p-4 border-b border-ink-100">
        <h2 className="text-sm font-semibold text-ink-900">
          {node ? labelForNode(node) : 'Properties'}
        </h2>
        <p className="text-xs text-ink-500 mt-1">
          {node ? 'Edit this element’s properties.' : 'Click anything in the canvas to edit it here.'}
        </p>
      </div>
      <div className="p-4">
        {!node && (
          <div className="text-xs text-ink-400 text-center py-12">
            Nothing selected.
          </div>
        )}

        {node?.kind === 'document' && (
          <>
            <Spec label="Page background">
              <ColorInput
                value={node.styles.backgroundColor}
                onChange={(v) => dispatch(composerActions.updateDocumentStyles({ backgroundColor: v }))}
              />
            </Spec>
            <Spec label="Content background">
              <ColorInput
                value={node.styles.contentBackground}
                onChange={(v) => dispatch(composerActions.updateDocumentStyles({ contentBackground: v }))}
              />
            </Spec>
            <Spec label="Content width">
              <NumberInput
                value={node.styles.contentWidth}
                onChange={(v) => dispatch(composerActions.updateDocumentStyles({ contentWidth: v }))}
                min={400}
                max={800}
                suffix="px"
              />
            </Spec>
          </>
        )}

        {node?.kind === 'block' && (
          <>
            <Spec label="Layout">
              <SelectInput
                value={node.block.layout}
                onChange={(v) => dispatch(composerActions.changeBlockLayout({ blockId: node.block.id, layout: v }))}
                options={layoutOptions}
              />
            </Spec>
            <Spec label="Background">
              <ColorInput
                value={node.block.background}
                onChange={(v) =>
                  dispatch(composerActions.updateBlock({ blockId: node.block.id, patch: { background: v } }))
                }
              />
            </Spec>
            <div className="grid grid-cols-2 gap-3">
              <Spec label="Padding Y">
                <NumberInput
                  value={node.block.paddingY}
                  onChange={(v) =>
                    dispatch(composerActions.updateBlock({ blockId: node.block.id, patch: { paddingY: v } }))
                  }
                  suffix="px"
                />
              </Spec>
              <Spec label="Padding X">
                <NumberInput
                  value={node.block.paddingX}
                  onChange={(v) =>
                    dispatch(composerActions.updateBlock({ blockId: node.block.id, patch: { paddingX: v } }))
                  }
                  suffix="px"
                />
              </Spec>
            </div>
          </>
        )}

        {node?.kind === 'cell' && (
          <div className="text-xs text-ink-500">
            Use the navigation panel on the left to add elements to this column.
          </div>
        )}

        {node?.kind === 'element' && (
          <ElementProps element={node.element} blockId={node.block.id} cellId={node.cell.id} />
        )}

        {node?.kind === 'footer' && (
          <>
            <Spec label="Helper text">
              <TextInput
                value={node.footer.helperText}
                onChange={(v) => dispatch(composerActions.updateFooter({ helperText: v }))}
              />
            </Spec>
            <Spec label="Business name">
              <TextInput
                value={node.footer.businessName}
                onChange={(v) => dispatch(composerActions.updateFooter({ businessName: v }))}
              />
            </Spec>
            <Spec label="Business address">
              <TextInput
                value={node.footer.businessAddress}
                onChange={(v) => dispatch(composerActions.updateFooter({ businessAddress: v }))}
              />
            </Spec>
            <Spec label="Background">
              <ColorInput
                value={node.footer.background}
                onChange={(v) => dispatch(composerActions.updateFooter({ background: v }))}
              />
            </Spec>
            <Spec label="Text color">
              <ColorInput
                value={node.footer.textColor}
                onChange={(v) => dispatch(composerActions.updateFooter({ textColor: v }))}
              />
            </Spec>
            <Spec label="Unsubscribe">
              <ToggleInput
                value={node.footer.showUnsubscribe}
                onChange={(v) => dispatch(composerActions.updateFooter({ showUnsubscribe: v }))}
                label="Show unsubscribe link"
              />
            </Spec>
            {node.footer.showUnsubscribe && (
              <Spec label="Unsubscribe label">
                <TextInput
                  value={node.footer.unsubscribeLabel}
                  onChange={(v) => dispatch(composerActions.updateFooter({ unsubscribeLabel: v }))}
                />
              </Spec>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

function labelForNode(node: NonNullable<ReturnType<typeof selectSelectedNode>>): string {
  switch (node.kind) {
    case 'document':
      return 'Document styles'
    case 'block':
      return 'Block'
    case 'cell':
      return 'Column'
    case 'element':
      return capitalize(node.element.type)
    case 'footer':
      return 'Footer'
  }
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function ElementProps({
  element,
  blockId,
  cellId,
}: {
  element: ComposerElement
  blockId: string
  cellId: string
}) {
  const dispatch = useAppDispatch()
  const update = (patch: Partial<ComposerElement>) =>
    dispatch(
      composerActions.updateElement({
        blockId,
        cellId,
        elementId: element.id,
        patch,
      }),
    )

  switch (element.type) {
    case 'text':
      return <TextProps element={element} update={update} />
    case 'image':
      return <ImageProps element={element} update={update} />
    case 'button':
      return <ButtonProps element={element} update={update} />
    case 'divider':
      return <DividerProps element={element} update={update} />
    case 'spacer':
      return <SpacerProps element={element} update={update} />
  }
}

function TextProps({ element, update }: { element: TextElement; update: (p: Partial<TextElement>) => void }) {
  return (
    <>
      <div className="text-xs text-ink-500 mb-3">
        Click into the text on the canvas to edit content. Use the toolbar (coming next) for inline formatting.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Spec label="Padding Y">
          <NumberInput value={element.paddingY} onChange={(v) => update({ paddingY: v })} suffix="px" />
        </Spec>
        <Spec label="Padding X">
          <NumberInput value={element.paddingX} onChange={(v) => update({ paddingX: v })} suffix="px" />
        </Spec>
      </div>
    </>
  )
}

function ImageProps({ element, update }: { element: ImageElement; update: (p: Partial<ImageElement>) => void }) {
  return (
    <>
      <Spec label="Image URL">
        <TextInput value={element.src} onChange={(v) => update({ src: v })} />
      </Spec>
      <Spec label="Alt text">
        <TextInput value={element.alt} onChange={(v) => update({ alt: v })} />
      </Spec>
      <Spec label="Link URL (optional)">
        <TextInput value={element.href} onChange={(v) => update({ href: v })} placeholder="https://" />
      </Spec>
      <Spec label="Alignment">
        <SelectInput value={element.alignment} onChange={(v) => update({ alignment: v })} options={alignmentOptions} />
      </Spec>
      <Spec label="Width %">
        <NumberInput value={element.widthPct} onChange={(v) => update({ widthPct: v })} min={10} max={100} suffix="%" />
      </Spec>
    </>
  )
}

function ButtonProps({ element, update }: { element: ButtonElement; update: (p: Partial<ButtonElement>) => void }) {
  return (
    <>
      <Spec label="Label">
        <TextInput value={element.label} onChange={(v) => update({ label: v })} />
      </Spec>
      <Spec label="Link URL">
        <TextInput value={element.href} onChange={(v) => update({ href: v })} placeholder="https://" />
      </Spec>
      <Spec label="Alignment">
        <SelectInput value={element.alignment} onChange={(v) => update({ alignment: v })} options={alignmentOptions} />
      </Spec>
      <Spec label="Background">
        <ColorInput value={element.background} onChange={(v) => update({ background: v })} />
      </Spec>
      <Spec label="Text color">
        <ColorInput value={element.textColor} onChange={(v) => update({ textColor: v })} />
      </Spec>
      <div className="grid grid-cols-2 gap-3">
        <Spec label="Radius">
          <NumberInput value={element.borderRadius} onChange={(v) => update({ borderRadius: v })} suffix="px" />
        </Spec>
        <Spec label="Font weight">
          <NumberInput value={element.fontWeight} onChange={(v) => update({ fontWeight: v })} min={300} max={900} />
        </Spec>
        <Spec label="Padding Y">
          <NumberInput value={element.paddingY} onChange={(v) => update({ paddingY: v })} suffix="px" />
        </Spec>
        <Spec label="Padding X">
          <NumberInput value={element.paddingX} onChange={(v) => update({ paddingX: v })} suffix="px" />
        </Spec>
      </div>
    </>
  )
}

function DividerProps({ element, update }: { element: DividerElement; update: (p: Partial<DividerElement>) => void }) {
  return (
    <>
      <Spec label="Color">
        <ColorInput value={element.color} onChange={(v) => update({ color: v })} />
      </Spec>
      <Spec label="Thickness">
        <NumberInput value={element.thickness} onChange={(v) => update({ thickness: v })} min={1} max={10} suffix="px" />
      </Spec>
      <Spec label="Padding Y">
        <NumberInput value={element.paddingY} onChange={(v) => update({ paddingY: v })} suffix="px" />
      </Spec>
    </>
  )
}

function SpacerProps({ element, update }: { element: SpacerElement; update: (p: Partial<SpacerElement>) => void }) {
  return (
    <Spec label="Height">
      <NumberInput value={element.height} onChange={(v) => update({ height: v })} min={4} max={200} suffix="px" />
    </Spec>
  )
}
