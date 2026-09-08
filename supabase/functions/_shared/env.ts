// Centralised env access. Reading process env in one place means a missing
// variable fails loudly at boot with a name attached, instead of surfacing
// later as an opaque 401 from a provider.

export const requireEnv = (name: string): string => {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const optionalEnv = (name: string, fallback = ''): string =>
  Deno.env.get(name) ?? fallback

// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected into every Edge Function
// by the platform; the rest are set with `supabase secrets set`.
export const env = {
  supabaseUrl: () => requireEnv('SUPABASE_URL'),
  serviceRoleKey: () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  anonKey: () => requireEnv('SUPABASE_ANON_KEY'),

  // Signs open/click/unsubscribe links. Rotating it invalidates every tracking
  // link already sitting in an inbox, so rotate deliberately.
  trackingSecret: () => requireEnv('TRACKING_SECRET'),

  // Public base URL of the functions gateway, used to build absolute tracking
  // links that an email client can resolve.
  functionsBaseUrl: () =>
    optionalEnv('FUNCTIONS_BASE_URL', `${requireEnv('SUPABASE_URL')}/functions/v1`),

  emailProvider: () => optionalEnv('EMAIL_PROVIDER', 'console'),
  resendApiKey: () => optionalEnv('RESEND_API_KEY'),
}
