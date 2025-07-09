import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔄 [API/test] Products API called')
  const supabaseAdmin = getSupabaseAdmin()
  // Fetch all products
  console.log('🔄 [API/test] Fetching products...')
  const { data: products, error: productsError } = await supabaseAdmin.from('products').select('*')
  if (productsError) {
    console.error('❌ [API/test] Error fetching products:', productsError)
    return res.status(500).json({ error: productsError.message })
  }
  console.log('✅ [API/test] Products fetched:', products?.length || 0)

  // Fetch all variants
  console.log('🔄 [API/test] Fetching product variants...')
  const { data: variants, error: variantsError } = await supabaseAdmin.from('product_variants').select('*')
  if (variantsError) {
    console.error('❌ [API/test] Error fetching variants:', variantsError)
    return res.status(500).json({ error: variantsError.message })
  }
  console.log('✅ [API/test] Variants fetched:', variants?.length || 0)

  // Group variants by product_id
  const variantsByProduct: Record<string, unknown[]> = {}
  for (const variant of variants) {
    if (!variantsByProduct[variant.product_id]) {
      variantsByProduct[variant.product_id] = []
    }
    variantsByProduct[variant.product_id].push(variant)
  }

  // Return array of { product, variants }
  const result = products.map((product) => ({
    product,
    variants: variantsByProduct[product.id] || []
  }))

  console.log('✅ [API/test] Returning result with', result.length, 'products')
  res.status(200).json(result)
}
