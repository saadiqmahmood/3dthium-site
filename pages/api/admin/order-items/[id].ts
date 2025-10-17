import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid order item ID' })
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    console.log('🔍 [API/admin/order-items/[id]] Updating order item:', id)
    const { error } = await supabaseAdmin.from('order_items').update(req.body).eq('id', id)

    if (error) {
      console.error('❌ [API/admin/order-items/[id]] Error updating order item:', error)
      return res.status(500).json({ error: 'Failed to update order item' })
    }

    console.log('✅ [API/admin/order-items/[id]] Order item updated successfully')
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('❌ [API/admin/order-items/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
