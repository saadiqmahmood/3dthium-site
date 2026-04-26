import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '../../../lib/log'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.debug('[API/admin/users] Fetching users...')
    const supabaseAdmin = getSupabaseAdmin()

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, created_at, is_admin, auth_user_id')
      .order('created_at', { ascending: false })

    if (error) {
      log.error('[API/admin/users] Error fetching users:', error)
      return res.status(500).json({ error: 'Failed to fetch users' })
    }

    log.debug('[API/admin/users] Users fetched successfully:', users?.length || 0)
    res.status(200).json(users || [])
  } catch (error) {
    log.error('[API/admin/users] Error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}
