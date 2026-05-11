import { createClient } from '@supabase/supabase-js'

// Single Supabase client instance for the entire app (browser/client-side)
// Uses localStorage — reliable for CSR Pages Router apps across all environments
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

// Helper to get the service role client for API routes only (server-side)
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service role key or URL is missing in environment variables.')
  }
  return createClient(url, key)
}
