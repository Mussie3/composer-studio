export type OutboundEmail = {
  to: string
  from: string        // "Name <address>"
  replyTo?: string
  subject: string
  html: string
}

export type SendResult = {
  to: string
  ok: boolean
  messageId?: string
  error?: string
}

export type EmailProvider = {
  name: string
  /** Providers cap batch size; the caller chunks to this number. */
  maxBatch: number
  send(messages: OutboundEmail[]): Promise<SendResult[]>
}
