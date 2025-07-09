import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid product ID' })
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    console.log('🔍 [API/admin/products/[id]] Deleting product:', id)
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ [API/admin/products/[id]] Error deleting product:', error)
      return res.status(500).json({ error: 'Failed to delete product' })
    }

    console.log('✅ [API/admin/products/[id]] Product deleted successfully')
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('❌ [API/admin/products/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 