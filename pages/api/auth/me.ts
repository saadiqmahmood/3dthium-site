import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const adminSupabase = getSupabaseAdmin()

  const {
    data: { user },
    error,
  } = await adminSupabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data: userRow } = await adminSupabase
    .from('users')
    .select('id, is_admin')
    .eq('auth_user_id', user.id)
    .single()

  return res.status(200).json({
    userId: user.id,
    email: user.email ?? null,
    isAdmin: !!userRow?.is_admin,
  })
}
