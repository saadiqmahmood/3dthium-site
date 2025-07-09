import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid custom order ID' })
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    console.log('🔍 [API/admin/custom-orders/[id]] Deleting custom order:', id)
    const { error } = await supabaseAdmin
      .from('custom_orders')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('❌ [API/admin/custom-orders/[id]] Error deleting custom order:', error)
      return res.status(500).json({ error: 'Failed to delete custom order' })
    }

    console.log('✅ [API/admin/custom-orders/[id]] Custom order deleted successfully')
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('❌ [API/admin/custom-orders/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 