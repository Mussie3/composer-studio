import { env } from '../env.ts'
import { consoleProvider } from './console.ts'
import { resendProvider } from './resend.ts'
import type { EmailProvider } from './types.ts'

const PROVIDERS: Record<string, EmailProvider> = {
  console: consoleProvider,
  resend: resendProvider,
}

/**
 * Sending is the one part of this stack Supabase cannot do itself, so it sits
 * behind an interface with exactly one method. Swapping Resend for SES,
 * Postmark, or Mailgun is a new file in this folder and one env var -- nothing
 * in the send pipeline knows which provider it is talking to.
 */
export const getProvider = (): EmailProvider =>
  PROVIDERS[env.emailProvider()] ?? consoleProvider

export type { EmailProvider, OutboundEmail, SendResult } from './types.ts'
