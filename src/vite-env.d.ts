/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'mock' (default) keeps everything in localStorage; 'supabase' hits the real backend. */
  readonly VITE_BACKEND?: 'mock' | 'supabase'
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
