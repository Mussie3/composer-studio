import {
  createBlock,
  createButtonElement,
  createCell,
  createDividerElement,
  createEmptyDocument,
  createImageElement,
  createSpacerElement,
  createTextElement,
} from './factories'
import type { ComposerDocument, Template } from './types'

const announcement = (): ComposerDocument => {
  const doc = createEmptyDocument()
  doc.styles.contentBackground = '#ffffff'
  doc.styles.backgroundColor = '#f4f6fb'
  doc.blocks = [
    {
      ...createBlock('single', { paddingY: 0, paddingX: 0 }),
      cells: [
        createCell([
          createImageElement({
            src: 'https://placehold.co/600x220/3a6df0/ffffff?text=Big+news',
            alt: 'Hero',
            paddingX: 0,
            paddingY: 0,
          }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 24 }),
      cells: [
        createCell([
          createTextElement({
            html: '<h1 style="margin:0 0 12px;font-size:30px;letter-spacing:-0.5px;">We just shipped something big.</h1><p style="margin:0;color:#4b5563;line-height:1.6;">A short paragraph about what changed and why anyone should care. Two or three sentences max — make them want to click through.</p>',
          }),
          createSpacerElement({ height: 16 }),
          createButtonElement({ label: 'Read the announcement', href: 'https://example.com' }),
        ]),
      ],
    },
  ]
  return doc
}

const newsletter = (): ComposerDocument => {
  const doc = createEmptyDocument()
  doc.blocks = [
    {
      ...createBlock('single', { paddingY: 24, background: '#0f172a' }),
      cells: [
        createCell([
          createTextElement({
            html: '<h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:-0.3px;">The Weekly · Issue #42</h1><p style="margin:6px 0 0;color:#cbd5e1;font-size:13px;">May 6, 2026</p>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 20 }),
      cells: [
        createCell([
          createTextElement({
            html: '<h2 style="margin:0 0 10px;font-size:20px;">In this issue</h2><ol style="margin:0;padding-left:20px;color:#374151;line-height:1.7;"><li>Three things we’re reading</li><li>A new feature you should try</li><li>Question of the week</li></ol>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 0 }),
      cells: [createCell([createDividerElement({})])],
    },
    {
      ...createBlock('double-50-50', { paddingY: 20 }),
      cells: [
        createCell([
          createTextElement({
            html: '<h3 style="margin:0 0 6px;font-size:16px;">Reading list</h3><p style="margin:0;color:#4b5563;line-height:1.6;">Three short paragraphs about what we’re reading this week. Link out, keep it tight.</p>',
          }),
        ]),
        createCell([
          createTextElement({
            html: '<h3 style="margin:0 0 6px;font-size:16px;">Did you know?</h3><p style="margin:0;color:#4b5563;line-height:1.6;">A surprising fact, an internal stat, or a behind-the-scenes detail.</p>',
          }),
        ]),
      ],
    },
  ]
  return doc
}

const productUpdate = (): ComposerDocument => {
  const doc = createEmptyDocument()
  doc.blocks = [
    {
      ...createBlock('single', { paddingY: 24 }),
      cells: [
        createCell([
          createTextElement({
            html: '<h1 style="margin:0 0 8px;font-size:26px;">Hi {{firstName}},</h1><p style="margin:0;color:#4b5563;line-height:1.6;">Here’s a quick rundown of what we shipped this month.</p>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('double-33-67', { paddingY: 16 }),
      cells: [
        createCell([
          createImageElement({
            src: 'https://placehold.co/180x180/eef4ff/3a6df0?text=1',
            alt: 'Feature 1',
            widthPct: 100,
          }),
        ]),
        createCell([
          createTextElement({
            html: '<h3 style="margin:0 0 6px;font-size:18px;">Feature one</h3><p style="margin:0;color:#4b5563;line-height:1.6;">A short description of the feature, who it’s for, and the headline benefit.</p>',
          }),
          createButtonElement({ label: 'Learn more', href: 'https://example.com' }),
        ]),
      ],
    },
    {
      ...createBlock('double-33-67', { paddingY: 16 }),
      cells: [
        createCell([
          createImageElement({
            src: 'https://placehold.co/180x180/eef4ff/3a6df0?text=2',
            alt: 'Feature 2',
            widthPct: 100,
          }),
        ]),
        createCell([
          createTextElement({
            html: '<h3 style="margin:0 0 6px;font-size:18px;">Feature two</h3><p style="margin:0;color:#4b5563;line-height:1.6;">A short description of the feature, who it’s for, and the headline benefit.</p>',
          }),
          createButtonElement({ label: 'Learn more', href: 'https://example.com' }),
        ]),
      ],
    },
  ]
  return doc
}

const blank = (): ComposerDocument => createEmptyDocument()

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from nothing and build it your way.',
    previewImage: 'https://placehold.co/300x180/f6f7fa/9ca3af?text=Blank',
    document: blank(),
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Hero image, big headline, and a single call to action.',
    previewImage: 'https://placehold.co/300x180/3a6df0/ffffff?text=Announcement',
    document: announcement(),
  },
  {
    id: 'newsletter',
    name: 'Weekly newsletter',
    description: 'Dark header, table of contents, two-column reading list.',
    previewImage: 'https://placehold.co/300x180/0f172a/ffffff?text=Newsletter',
    document: newsletter(),
  },
  {
    id: 'product-update',
    name: 'Product update',
    description: 'Personalized greeting plus stacked feature highlights with CTAs.',
    previewImage: 'https://placehold.co/300x180/eef4ff/3a6df0?text=Product+Update',
    document: productUpdate(),
  },
]

export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id) ?? null
