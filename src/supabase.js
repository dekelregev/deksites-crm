import { createClient } from '@supabase/supabase-js'

// Vite: import.meta.env.VITE_*   |  Next.js: process.env.NEXT_PUBLIC_*
const url  = import.meta?.env?.VITE_SUPABASE_URL  ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = import.meta?.env?.VITE_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  // Fail loud in dev rather than silently querying nothing.
  console.warn('Missing Supabase env vars. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
})
