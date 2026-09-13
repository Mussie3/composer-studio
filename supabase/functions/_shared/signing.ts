// Tracking links travel through untrusted space: they sit in inboxes, get
// forwarded, and are fetched by anonymous clients. A link therefore has to prove
// it was minted by us, or anyone could POST fabricated opens and clicks at the
// stats endpoint. Every link carries an HMAC-SHA256 over its own payload.

import { env } from './env.ts'

const encoder = new TextEncoder()

const base64url = (bytes: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')

let keyPromise: Promise<CryptoKey> | null = null

const hmacKey = (): Promise<CryptoKey> => {
  keyPromise ??= crypto.subtle.importKey(
    'raw',
    encoder.encode(env.trackingSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return keyPromise
}

const sign = async (payload: string): Promise<string> =>
  base64url(await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(payload)))

export type TrackingClaims = { mailId: string; recipientId: string }

export const mintToken = async ({ mailId, recipientId }: TrackingClaims): Promise<string> => {
  const payload = `${mailId}.${recipientId}`
  return `${payload}.${await sign(payload)}`
}

export const verifyToken = async (token: string): Promise<TrackingClaims | null> => {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [mailId, recipientId, signature] = parts
  const expected = await sign(`${mailId}.${recipientId}`)

  // Length-independent comparison. The strings are the same length in every
  // real case, so a plain !== would still be constant-ish, but comparing byte by
  // byte without early exit removes the question entirely.
  if (signature.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < signature.length; i++) {
    diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0 ? { mailId, recipientId } : null
}
