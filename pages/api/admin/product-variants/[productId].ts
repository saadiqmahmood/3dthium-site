import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Invalid product ID' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'GET':
        console.log('🔍 [API/admin/product-variants/[productId]] Fetching variants for product:', productId)
        const { data, error } = await supabaseAdmin
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)

        if (error) {
          console.error('❌ [API/admin/product-variants/[productId]] Error fetching variants:', error)
          return res.status(500).json({ error: 'Failed to fetch product variants' })
        }

        console.log('✅ [API/admin/product-variants/[productId]] Variants fetched successfully:', data?.length || 0)
        res.status(200).json(data || [])
        break

      case 'POST':
        console.log('🔍 [API/admin/product-variants/[productId]] Creating variant for product:', productId)
        const { error: createError } = await supabaseAdmin
          .from('product_variants')
          .insert([{
            ...req.body,
            price: Number(req.body.price),
            product_id: productId
          }])

        if (createError) {
          console.error('❌ [API/admin/product-variants/[productId]] Error creating variant:', createError)
          return res.status(500).json({ error: 'Failed to create product variant' })
        }

        console.log('✅ [API/admin/product-variants/[productId]] Variant created successfully')
        res.status(200).json({ success: true })
        break

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('❌ [API/admin/product-variants/[productId]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 