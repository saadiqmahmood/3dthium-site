import { NextApiRequest, NextApiResponse } from 'next'
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

    console.log('🔍 [API/check-admin] Checking admin status for user:', userId)

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', userId)
      .single()

    if (error) {
      console.error('❌ [API/check-admin] Error checking admin status:', error)
      return res.status(500).json({ error: 'Failed to check admin status' })
    }

    console.log('✅ [API/check-admin] Admin status result:', data)
    res.status(200).json({ isAdmin: !!data?.is_admin })
  } catch (error) {
    console.error('❌ [API/check-admin] Exception checking admin status:', error)
    res.status(500).json({ error: 'Failed to check admin status' })
  }
}
