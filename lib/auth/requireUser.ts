import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export interface UserIdentity {
  authUserId: string
  dbUserId: string
}

export async function requireUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<UserIdentity | null> {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }

  const adminSupabase = getSupabaseAdmin()
  const {
    data: { user },
    error,
  } = await adminSupabase.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }

  const { data: userRow } = await adminSupabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!userRow) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }

  return { authUserId: user.id, dbUserId: userRow.id }
}
