import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client using the anon key — subject to RLS, safe for public reads.
 * Use this in any route that does not require admin access.
 * Never use the service role client for public-facing endpoints.
 */
export function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase URL or anon key missing from environment variables.')
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
