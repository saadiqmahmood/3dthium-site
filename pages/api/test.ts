import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Fetch all products
  const { data: products, error: productsError } = await supabase.from('products').select('*')
  if (productsError) {
    return res.status(500).json({ error: productsError.message })
  }

  // Fetch all variants
  const { data: variants, error: variantsError } = await supabase.from('product_variants').select('*')
  if (variantsError) {
    return res.status(500).json({ error: variantsError.message })
  }

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

  res.status(200).json(result)
}
