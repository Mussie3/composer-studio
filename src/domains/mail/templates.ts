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

const softLaunch = (): ComposerDocument => {
  const doc = createEmptyDocument()
  doc.styles.backgroundColor = '#FFF7F0'
  doc.styles.contentBackground = '#FFFFFF'
  doc.footer.background = '#FFF7F0'
  doc.footer.textColor = '#9A7B5A'
  doc.blocks = [
    {
      ...createBlock('single', { paddingY: 40, background: '#FFFFFF' }),
      cells: [
        createCell([
          createTextElement({
            html: '<p style="margin:0;text-align:center;color:#F97316;font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;">Now in beta</p><h1 style="margin:14px 0 12px;text-align:center;font-size:34px;letter-spacing:-0.5px;color:#1F2937;">Quietly built. Quickly used.</h1><p style="margin:0;text-align:center;color:#6B7280;line-height:1.7;font-size:15px;">A small invite for the people we built this for first. We&rsquo;d love your honest reactions.</p>',
            paddingX: 32,
          }),
          createSpacerElement({ height: 18 }),
          createButtonElement({
            label: 'Take a look',
            href: 'https://example.com',
            background: '#F97316',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 0 }),
      cells: [
        createCell([
          createDividerElement({ color: '#FED7AA', thickness: 1, paddingY: 8 }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 28 }),
      cells: [
        createCell([
          createTextElement({
            html: '<p style="margin:0 0 12px;color:#374151;line-height:1.7;">Hi {{firstName}},</p><p style="margin:0 0 10px;color:#374151;line-height:1.7;">We&rsquo;ve been quiet for a while because we wanted the first version to feel right. It&rsquo;s not perfect &mdash; but it does the thing.</p><p style="margin:0;color:#374151;line-height:1.7;">If you have ten minutes, we&rsquo;d love your gut reaction.</p>',
          }),
        ]),
      ],
    },
  ]
  return doc
}

const minimalReceipt = (): ComposerDocument => {
  const doc = createEmptyDocument()
  doc.styles.backgroundColor = '#F8FAFC'
  doc.styles.contentBackground = '#FFFFFF'
  doc.styles.contentWidth = 560
  doc.footer.background = '#FFFFFF'
  doc.footer.helperText = 'Questions? Reply to this email — we read everything.'
  doc.blocks = [
    {
      ...createBlock('single', { paddingY: 32 }),
      cells: [
        createCell([
          createTextElement({
            html: '<p style="margin:0 0 4px;color:#10B981;font-size:12px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;">Order confirmed</p><h1 style="margin:0 0 6px;font-size:26px;letter-spacing:-0.3px;">Thanks, {{firstName}}.</h1><p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">Order #A-29381 will be on its way shortly. We&rsquo;ll email tracking info when it ships.</p>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 0 }),
      cells: [createCell([createDividerElement({ color: '#E5E7EB', thickness: 1, paddingY: 0 })])],
    },
    {
      ...createBlock('double-67-33', { paddingY: 18 }),
      cells: [
        createCell([
          createTextElement({
            html: '<div style="font-size:14px;color:#1F2937;font-weight:600;">Composer Studio · Annual</div><div style="font-size:12px;color:#6B7280;margin-top:2px;">Renews May 6, 2027</div>',
          }),
        ]),
        createCell([
          createTextElement({
            html: '<div style="font-size:14px;color:#1F2937;font-weight:600;text-align:right;">$96.00</div>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 0 }),
      cells: [createCell([createDividerElement({ color: '#E5E7EB', thickness: 1, paddingY: 0 })])],
    },
    {
      ...createBlock('double-67-33', { paddingY: 14 }),
      cells: [
        createCell([
          createTextElement({
            html: '<div style="font-size:13px;color:#6B7280;">Total billed today</div>',
          }),
        ]),
        createCell([
          createTextElement({
            html: '<div style="font-size:14px;color:#1F2937;font-weight:600;text-align:right;">$96.00</div>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 26 }),
      cells: [
        createCell([
          createButtonElement({
            label: 'View receipt',
            href: 'https://example.com',
            background: '#10B981',
            alignment: 'left',
          }),
        ]),
      ],
    },
  ]
  return doc
}

const boldOnboarding = (): ComposerDocument => {
  const doc = createEmptyDocument()
  doc.styles.backgroundColor = '#0F172A'
  doc.styles.contentBackground = '#0F172A'
  doc.footer.background = '#0F172A'
  doc.footer.textColor = '#94A3B8'
  doc.footer.helperText = 'Sent because you signed up. You can manage preferences anytime.'
  doc.blocks = [
    {
      ...createBlock('single', { paddingY: 40, background: '#0F172A' }),
      cells: [
        createCell([
          createTextElement({
            html: '<p style="margin:0;color:#94A3B8;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;">Welcome aboard</p><h1 style="margin:14px 0 0;color:#FFFFFF;font-size:48px;letter-spacing:-1px;line-height:1.05;">Day one,<br/>let&rsquo;s ship.</h1>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 24, background: '#0F172A' }),
      cells: [
        createCell([
          createTextElement({
            html: '<p style="margin:0;color:#CBD5E1;font-size:16px;line-height:1.7;">{{firstName}}, here are three things to do first. Do them in order &mdash; each one takes under five minutes and unlocks the next.</p>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('double-33-67', { paddingY: 14, background: '#1E293B' }),
      cells: [
        createCell([
          createTextElement({
            html: '<div style="background:#5B5FE3;color:#FFFFFF;width:36px;height:36px;border-radius:50%;display:inline-block;text-align:center;line-height:36px;font-weight:700;font-size:15px;">1</div>',
          }),
        ]),
        createCell([
          createTextElement({
            html: '<h3 style="margin:0 0 4px;color:#FFFFFF;font-size:16px;">Connect your domain</h3><p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">It&rsquo;s the difference between landing in the inbox or the spam folder.</p>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('double-33-67', { paddingY: 14, background: '#1E293B' }),
      cells: [
        createCell([
          createTextElement({
            html: '<div style="background:#5B5FE3;color:#FFFFFF;width:36px;height:36px;border-radius:50%;display:inline-block;text-align:center;line-height:36px;font-weight:700;font-size:15px;">2</div>',
          }),
        ]),
        createCell([
          createTextElement({
            html: '<h3 style="margin:0 0 4px;color:#FFFFFF;font-size:16px;">Import your list</h3><p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">CSV, paste, or sync from Stripe / HubSpot / Notion.</p>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('double-33-67', { paddingY: 14, background: '#1E293B' }),
      cells: [
        createCell([
          createTextElement({
            html: '<div style="background:#5B5FE3;color:#FFFFFF;width:36px;height:36px;border-radius:50%;display:inline-block;text-align:center;line-height:36px;font-weight:700;font-size:15px;">3</div>',
          }),
        ]),
        createCell([
          createTextElement({
            html: '<h3 style="margin:0 0 4px;color:#FFFFFF;font-size:16px;">Send a test campaign</h3><p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">Send to yourself first. Always. Even seasoned marketers do this.</p>',
          }),
        ]),
      ],
    },
    {
      ...createBlock('single', { paddingY: 28, background: '#0F172A' }),
      cells: [
        createCell([
          createButtonElement({
            label: 'Take me to step one',
            href: 'https://example.com',
            background: '#5B5FE3',
          }),
        ]),
      ],
    },
  ]
  return doc
}

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
  {
    id: 'soft-launch',
    name: 'Soft launch',
    description: 'Warm cream tones, centered headline, low-key invite to a small group.',
    previewImage: 'https://placehold.co/300x180/FFF7F0/F97316?text=Soft+launch',
    document: softLaunch(),
  },
  {
    id: 'minimal-receipt',
    name: 'Order receipt',
    description: 'Clean transactional layout: order line, total, and a single action.',
    previewImage: 'https://placehold.co/300x180/F8FAFC/10B981?text=Receipt',
    document: minimalReceipt(),
  },
  {
    id: 'bold-onboarding',
    name: 'Bold onboarding',
    description: 'Dark navy with vibrant accents. Three numbered steps to get a new user started.',
    previewImage: 'https://placehold.co/300x180/0F172A/5B5FE3?text=Bold+welcome',
    document: boldOnboarding(),
  },
]

export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id) ?? null
