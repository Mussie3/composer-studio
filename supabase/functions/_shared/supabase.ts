import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { env } from './env.ts'

// Service-role client: bypasses RLS. Used only for writes the caller is not
// allowed to make directly -- flipping mail status, recording deliveries, and
// logging engagement events fired by anonymous mail clients.
export const adminClient = (): SupabaseClient =>
  createClient(env.supabaseUrl(), env.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

// Caller-scoped client: carries the user's JWT, so every query is still subject
// to RLS. Ownership checks therefore come from the database, not from an `if`
// statement in this function that someone could forget to write.
export const userClient = (req: Request): SupabaseClient =>
  createClient(env.supabaseUrl(), env.anonKey(), {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

export const requireUser = async (req: Request) => {
  const client = userClient(req)
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) return { client, user: null }
  return { client, user: data.user }
}
