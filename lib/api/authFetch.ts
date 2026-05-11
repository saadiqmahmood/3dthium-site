import { supabase } from '@/lib/supabaseClient'

/**
 * Drop-in replacement for fetch() that automatically attaches the current
 * user's Bearer token. Use for all authenticated API calls.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
