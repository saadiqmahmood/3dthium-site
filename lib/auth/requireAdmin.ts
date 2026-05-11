import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export interface AdminIdentity {
  authUserId: string
  dbUserId: string
}

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AdminIdentity | null> {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }

  const adminSupabase = getSupabaseAdmin()

  // getUser() with a token makes a network call to verify the JWT — safe to trust.
  const {
    data: { user },
    error: authError,
  } = await adminSupabase.auth.getUser(token)

  if (authError || !user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }

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
