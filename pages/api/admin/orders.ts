import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 [API/admin/orders] Fetching orders...')
    const supabaseAdmin = getSupabaseAdmin()

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(
        'id, user_id, guest_email, total_price, status, created_at, shipping_method, shipping_cost, tracking_number'
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [API/admin/orders] Error fetching orders:', error)
      return res.status(500).json({ error: 'Failed to fetch orders' })
    }

    console.log('✅ [API/admin/orders] Orders fetched successfully:', orders?.length || 0)
    res.status(200).json(orders || [])
  } catch (error) {
    console.error('❌ [API/admin/orders] Error:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
}
