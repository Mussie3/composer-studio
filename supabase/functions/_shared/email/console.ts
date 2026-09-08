import type { EmailProvider, OutboundEmail, SendResult } from './types.ts'

/**
 * Default provider. Logs instead of sending.
 *
 * This exists so the whole pipeline -- claim, personalize, record delivery,
 * track -- is exercisable end to end with no API key and no risk of mailing a
 * real person from a dev branch. Set EMAIL_PROVIDER=resend to go live.
 */
export const consoleProvider: EmailProvider = {
  name: 'console',
  maxBatch: 100,
  send: (messages: OutboundEmail[]): Promise<SendResult[]> => {
    for (const m of messages) {
      console.log(
        `[console-mailer] to=${m.to} from=${m.from} subject=${JSON.stringify(m.subject)} bytes=${m.html.length}`,
      )
    }
    return Promise.resolve(
      messages.map((m) => ({
        to: m.to,
        ok: true,
        messageId: `console-${crypto.randomUUID()}`,
      })),
    )
  },
}
