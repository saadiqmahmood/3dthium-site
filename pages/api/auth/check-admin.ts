import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', userId)
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to check admin status' })
    }

    res.status(200).json({ isAdmin: !!data?.is_admin })
  } catch {
    res.status(500).json({ error: 'Failed to check admin status' })
  }
}
