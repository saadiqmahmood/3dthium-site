import { createServerClient } from '@supabase/ssr'
import type { NextApiRequest, NextApiResponse } from 'next'

export interface AdminIdentity {
  authUserId: string
  dbUserId: string
}

/**
 * Verifies the request carries a valid Supabase session belonging to an admin
 * user. Must be the first call in every admin API handler.
 *
 * Returns the verified identity on success, or sends a 401/403 response and
 * returns null so the caller can short-circuit.
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AdminIdentity | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({
            name,
            value: value ?? '',
          }))
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            res.setHeader(
              'Set-Cookie',
              `${name}=${value}; Path=${options?.path ?? '/'}; HttpOnly; SameSite=Lax${options?.secure ? '; Secure' : ''}`
            )
          }
        },
      },
    }
  )

  // getUser() makes a network call to verify the JWT — never trust getSession() alone.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }

  // Look up the public.users row and confirm is_admin.
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false },
    }
  )

  const { data: userRow, error: dbError } = await adminSupabase
    .from('users')
    .select('id, is_admin')
    .eq('auth_user_id', user.id)
    .single()

  if (dbError || !userRow) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }

  if (!userRow.is_admin) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }

  return { authUserId: user.id, dbUserId: userRow.id }
}
