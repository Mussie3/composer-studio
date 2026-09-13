import { env } from '../env.ts'
import type { EmailProvider, OutboundEmail, SendResult } from './types.ts'

const BATCH_ENDPOINT = 'https://api.resend.com/emails/batch'

type ResendBatchResponse = { data?: Array<{ id: string }>; message?: string; name?: string }

export const resendProvider: EmailProvider = {
  name: 'resend',
  // Resend's batch endpoint accepts 100 messages per call.
  maxBatch: 100,

  async send(messages: OutboundEmail[]): Promise<SendResult[]> {
    const apiKey = env.resendApiKey()
    if (!apiKey) {
      return messages.map((m) => ({ to: m.to, ok: false, error: 'RESEND_API_KEY not set' }))
    }

    const res = await fetch(BATCH_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        messages.map((m) => ({
          from: m.from,
          to: [m.to],
          reply_to: m.replyTo,
          subject: m.subject,
          html: m.html,
        })),
      ),
    })

    const payload = (await res.json().catch(() => ({}))) as ResendBatchResponse

    if (!res.ok) {
      // The whole batch failed as a unit (auth, rate limit, malformed payload).
      // Every message in it is reported failed so the delivery rows stay
      // truthful and the batch can be retried later.
      const error = payload.message ?? `resend responded ${res.status}`
      return messages.map((m) => ({ to: m.to, ok: false, error }))
    }

    // Resend returns ids positionally, matching the order sent.
    return messages.map((m, i) => ({
      to: m.to,
      ok: true,
      messageId: payload.data?.[i]?.id,
    }))
  },
}
