import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 [API/admin/custom-orders] Fetching custom orders...')
    const supabaseAdmin = getSupabaseAdmin()

    const { data: customOrders, error } = await supabaseAdmin
      .from('custom_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [API/admin/custom-orders] Error fetching custom orders:', error)
      return res.status(500).json({ error: 'Failed to fetch custom orders' })
    }

    console.log('✅ [API/admin/custom-orders] Custom orders fetched successfully:', customOrders?.length || 0)
    res.status(200).json(customOrders || [])
  } catch (error) {
    console.error('❌ [API/admin/custom-orders] Error:', error)
    res.status(500).json({ error: 'Failed to fetch custom orders' })
  }
} 