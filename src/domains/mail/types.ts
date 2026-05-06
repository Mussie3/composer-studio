export type MailStatus = 'draft' | 'scheduled' | 'sent'

export type Recipient = {
  email: string
  fields: Record<string, string>
}

export type MailStats = {
  recipientCount: number
  deliveredCount: number
  openCount: number
  clickCount: number
  unsubscribeCount: number
  bounceCount: number
}

export type Mail = {
  id: string
  title: string
  status: MailStatus
  subject: string
  preheader: string
  senderName: string
  senderEmail: string
  replyToEmail: string
  recipients: Recipient[]
  document: ComposerDocument
  templateId: string | null
  createdAt: string
  updatedAt: string
  scheduledAt: string | null
  sentAt: string | null
  stats: MailStats | null
}

export type DocumentStyles = {
  backgroundColor: string
  contentBackground: string
  contentWidth: number
  fontFamily: string
}

export type FooterBlock = {
  showUnsubscribe: boolean
  unsubscribeLabel: string
  helperText: string
  businessName: string
  businessAddress: string
  textColor: string
  background: string
}

export type ComposerDocument = {
  blocks: Block[]
  footer: FooterBlock
  styles: DocumentStyles
}

export type BlockLayout = 'single' | 'double-50-50' | 'double-33-67' | 'double-67-33'

export type Block = {
  id: string
  layout: BlockLayout
  background: string
  paddingY: number
  paddingX: number
  cells: Cell[]
}

export type Cell = {
  id: string
  elements: ComposerElement[]
}

export type ElementAlignment = 'left' | 'center' | 'right'

export type TextElement = {
  id: string
  type: 'text'
  html: string
  paddingY: number
  paddingX: number
}

export type ImageElement = {
  id: string
  type: 'image'
  src: string
  alt: string
  alignment: ElementAlignment
  widthPct: number
  href: string
  paddingY: number
  paddingX: number
}

export type ButtonElement = {
  id: string
  type: 'button'
  label: string
  href: string
  alignment: ElementAlignment
  background: string
  textColor: string
  borderRadius: number
  paddingX: number
  paddingY: number
  marginY: number
  fontWeight: number
}

export type DividerElement = {
  id: string
  type: 'divider'
  color: string
  thickness: number
  paddingY: number
}

export type SpacerElement = {
  id: string
  type: 'spacer'
  height: number
}

export type ComposerElement =
  | TextElement
  | ImageElement
  | ButtonElement
  | DividerElement
  | SpacerElement

export type ElementKind = ComposerElement['type']

export type Selection =
  | { kind: 'block'; blockId: string }
  | { kind: 'cell'; blockId: string; cellId: string }
  | { kind: 'element'; blockId: string; cellId: string; elementId: string }
  | { kind: 'footer' }
  | { kind: 'document' }

export type ViewMode = 'desktop' | 'mobile'

export type Template = {
  id: string
  name: string
  description: string
  previewImage: string
  document: ComposerDocument
}

export type SenderProfile = {
  senderName: string
  senderEmail: string
  replyToEmail: string
  isVerified: boolean
}

export type BusinessProfile = {
  businessName: string
  businessAddress: string
  websiteUrl: string
  logoUrl: string
}
