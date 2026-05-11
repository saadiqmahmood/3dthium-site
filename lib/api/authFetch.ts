import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

// Cache the session synchronously via onAuthStateChange so authFetch never
// needs to call getSession() — which blocks on a lock during token refreshes
// triggered by visibilitychange, hanging every admin API call.
let _cachedSession: Session | null = null
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedSession = session
})

/**
 * Drop-in replacement for fetch() that automatically attaches the current
 * user's Bearer token. Use for all authenticated API calls.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = _cachedSession?.access_token

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
