import { log } from '../../../../lib/log'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid custom order ID' })
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    log.debug('[API/admin/custom-orders/[id]] Deleting custom order:', id)
    const { error } = await supabaseAdmin.from('custom_orders').delete().eq('id', parseInt(id))

    if (error) {
      log.error('[API/admin/custom-orders/[id]] Error deleting custom order:', error)
      return res.status(500).json({ error: 'Failed to delete custom order' })
    }

    log.debug('[API/admin/custom-orders/[id]] Custom order deleted successfully')
    res.status(200).json({ success: true })
  } catch (error) {
    log.error('[API/admin/custom-orders/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
