import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId, variantId } = req.query

  if (!productId || typeof productId !== 'string' || !variantId || typeof variantId !== 'string') {
    return res.status(400).json({ error: 'Invalid product ID or variant ID' })
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    console.log('🔍 [API/admin/product-variants/[productId]/[variantId]] Deleting variant:', variantId, 'from product:', productId)
    const { error } = await supabaseAdmin
      .from('product_variants')
      .delete()
      .eq('id', variantId)
      .eq('product_id', productId)

    if (error) {
      console.error('❌ [API/admin/product-variants/[productId]/[variantId]] Error deleting variant:', error)
      return res.status(500).json({ error: 'Failed to delete variant' })
    }

    console.log('✅ [API/admin/product-variants/[productId]/[variantId]] Variant deleted successfully')
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('❌ [API/admin/product-variants/[productId]/[variantId]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 