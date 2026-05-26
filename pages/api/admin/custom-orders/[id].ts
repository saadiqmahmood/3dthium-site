import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '../../../../lib/log'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid custom order ID' })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const numericId = parseInt(id, 10)

  if (req.method === 'PATCH') {
    const { status, admin_notes } = req.body as { status?: string; admin_notes?: string }

    const updates: Record<string, unknown> = {}
    if (status !== undefined) updates.status = status
    if (admin_notes !== undefined) updates.admin_notes = admin_notes

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    log.debug('[API/admin/custom-orders/[id]] Updating custom order:', numericId)
    const { error } = await supabaseAdmin.from('custom_orders').update(updates).eq('id', numericId)

    if (error) {
      log.error('[API/admin/custom-orders/[id]] Error updating custom order:', error)
      return res.status(500).json({ error: 'Failed to update custom order' })
    }

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    log.debug('[API/admin/custom-orders/[id]] Deleting custom order:', numericId)
    const { error } = await supabaseAdmin.from('custom_orders').delete().eq('id', numericId)

    if (error) {
      log.error('[API/admin/custom-orders/[id]] Error deleting custom order:', error)
      return res.status(500).json({ error: 'Failed to delete custom order' })
    }

    log.debug('[API/admin/custom-orders/[id]] Custom order deleted successfully')
    return res.status(200).json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
