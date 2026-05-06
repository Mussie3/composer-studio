import { v4 as uuid } from 'uuid'
import type {
  Block,
  ButtonElement,
  Cell,
  ComposerDocument,
  ComposerElement,
  DividerElement,
  ImageElement,
  Mail,
  SpacerElement,
  TextElement,
} from './types'

export const createTextElement = (overrides: Partial<TextElement> = {}): TextElement => ({
  id: uuid(),
  type: 'text',
  html: '<p>Start writing your message here.</p>',
  paddingX: 24,
  paddingY: 12,
  ...overrides,
})

export const createImageElement = (overrides: Partial<ImageElement> = {}): ImageElement => ({
  id: uuid(),
  type: 'image',
  src: 'https://placehold.co/600x320/3a6df0/ffffff?text=Your+image',
  alt: 'Placeholder image',
  alignment: 'center',
  widthPct: 100,
  href: '',
  paddingX: 24,
  paddingY: 12,
  ...overrides,
})

export const createButtonElement = (overrides: Partial<ButtonElement> = {}): ButtonElement => ({
  id: uuid(),
  type: 'button',
  label: 'Click me',
  href: 'https://example.com',
  alignment: 'center',
  background: '#3a6df0',
  textColor: '#ffffff',
  borderRadius: 6,
  paddingX: 24,
  paddingY: 12,
  marginY: 12,
  fontWeight: 600,
  ...overrides,
})

export const createDividerElement = (overrides: Partial<DividerElement> = {}): DividerElement => ({
  id: uuid(),
  type: 'divider',
  color: '#e5e7eb',
  thickness: 1,
  paddingY: 12,
  ...overrides,
})

export const createSpacerElement = (overrides: Partial<SpacerElement> = {}): SpacerElement => ({
  id: uuid(),
  type: 'spacer',
  height: 24,
  ...overrides,
})

export const createElement = (kind: ComposerElement['type']): ComposerElement => {
  switch (kind) {
    case 'text':
      return createTextElement()
    case 'image':
      return createImageElement()
    case 'button':
      return createButtonElement()
    case 'divider':
      return createDividerElement()
    case 'spacer':
      return createSpacerElement()
  }
}

export const createCell = (elements: ComposerElement[] = []): Cell => ({
  id: uuid(),
  elements,
})

export const createBlock = (
  layout: Block['layout'] = 'single',
  overrides: Partial<Omit<Block, 'id' | 'cells'>> = {},
): Block => {
  const cellCount = layout === 'single' ? 1 : 2
  return {
    id: uuid(),
    layout,
    background: '#ffffff',
    paddingX: 16,
    paddingY: 16,
    cells: Array.from({ length: cellCount }, () => createCell()),
    ...overrides,
  }
}

export const createEmptyDocument = (): ComposerDocument => ({
  blocks: [],
  footer: {
    showUnsubscribe: true,
    unsubscribeLabel: 'Unsubscribe',
    helperText: 'You received this email because you subscribed to our updates.',
    businessName: 'Your Company',
    businessAddress: '123 Example Street, City, Country',
    textColor: '#6b7280',
    background: '#f9fafb',
  },
  styles: {
    backgroundColor: '#f6f7fa',
    contentBackground: '#ffffff',
    contentWidth: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
})

export const createSeedDocument = (): ComposerDocument => {
  const doc = createEmptyDocument()
  doc.blocks = [
    {
      ...createBlock('single'),
      cells: [
        createCell([
          createImageElement({
            src: 'https://placehold.co/600x180/3a6df0/ffffff?text=Composer+Studio',
            alt: 'Header banner',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single'),
      cells: [
        createCell([
          createTextElement({
            html: '<h1 style="margin:0 0 8px;font-size:28px;">Hi {{firstName}},</h1><p style="margin:0;color:#4b5563;">Welcome to <strong>Composer Studio</strong>. This is a sample email built with the editor on the left.</p>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('double-50-50'),
      cells: [
        createCell([
          createTextElement({
            html: '<h3 style="margin:0 0 6px;">Drag &amp; drop</h3><p style="margin:0;color:#4b5563;">Reorder sections, add new ones, and edit content inline.</p>',
          }),
        ]),
        createCell([
          createTextElement({
            html: '<h3 style="margin:0 0 6px;">Live preview</h3><p style="margin:0;color:#4b5563;">See exactly what your subscribers will see, on desktop and mobile.</p>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single'),
      cells: [
        createCell([
          createButtonElement({ label: 'Get started', href: 'https://example.com' }),
        ]),
      ],
    },
  ]
  return doc
}

export const createMail = (overrides: Partial<Mail> = {}): Mail => {
  const now = new Date().toISOString()
  return {
    id: uuid(),
    title: 'Untitled email',
    status: 'draft',
    subject: '',
    preheader: '',
    senderName: '',
    senderEmail: '',
    replyToEmail: '',
    recipients: [],
    document: createEmptyDocument(),
    templateId: null,
    createdAt: now,
    updatedAt: now,
    scheduledAt: null,
    sentAt: null,
    stats: null,
    ...overrides,
  }
}
