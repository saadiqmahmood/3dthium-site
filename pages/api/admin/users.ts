import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 [API/admin/users] Fetching users...')
    const supabaseAdmin = getSupabaseAdmin()

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, created_at, is_admin, auth_user_id')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [API/admin/users] Error fetching users:', error)
      return res.status(500).json({ error: 'Failed to fetch users' })
    }

    console.log('✅ [API/admin/users] Users fetched successfully:', users?.length || 0)
    res.status(200).json(users || [])
  } catch (error) {
    console.error('❌ [API/admin/users] Error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}
