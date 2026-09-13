import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@api/supabase'
import BrandLogo from './BrandLogo'

/**
 * Sign-in gate for the Supabase backend.
 *
 * Every table is behind RLS keyed on auth.uid(), so without a session the app
 * would render empty lists and unexplained failures. This is the smallest thing
 * that makes the backend reachable -- it is not trying to be a full account UI.
 *
 * When VITE_BACKEND is left on 'mock' this component is never mounted and the
 * app behaves exactly as it did before.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    // Covers token refresh and sign-out from another tab, so a stale session
    // never sits behind a rendered app.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => sub.subscription.unsubscribe()
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setStatus(null)

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setBusy(false)
    if (error) setStatus(error.message)
    else if (mode === 'signup') setStatus('Account created. Check your inbox if confirmation is on.')
  }

  if (!ready) return null
  if (session) return <>{children}</>

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="panel w-full max-w-sm p-8 space-y-5">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Composer Studio</h1>
            <p className="text-sm text-ink-500">
              {mode === 'signin' ? 'Sign in to your drafts' : 'Create an account'}
            </p>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink-200 px-3 py-2"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink-200 px-3 py-2"
          />
        </label>

        {status && <p className="text-sm text-red-600">{status}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setStatus(null)
          }}
          className="w-full text-sm text-ink-500 hover:text-ink-700"
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
