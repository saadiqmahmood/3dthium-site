import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { ProductVariantNew } from '@/types'

// Public client for frontend consumption
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    // Fetch active products with category information
    const { data: products, error: productsError } = await supabase
      .from('products_new')
      .select(`
        id,
        name,
        description,
        slug,
        base_price,
        thumbnail_url,
        is_active,
        customizable,
        created_at,
        categories!category_id(
          name,
          slug
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (productsError) {
      console.error('❌ [API/products] Error fetching products:', productsError)
      return res.status(500).json({ error: 'Failed to fetch products' })
    }

    if (!products || products.length === 0) {
      console.log('⚠️ [API/products] No active products found')
      return res.status(200).json({ products: [] })
    }

    // Fetch variants for all products
    const productIds = products.map((p) => p.id)
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants_new')
      .select(`
        id,
        product_id,
        size,
        color,
        material,
        price_adjustment,
        is_available,
        sku
      `)
      .in('product_id', productIds)
      .eq('is_available', true)

    if (variantsError) {
      return res.status(500).json({ error: 'Failed to fetch variants' })
    }

    // Group variants by product_id
    const variantsByProduct: Record<string, ProductVariantNew[]> = {}
    if (variants) {
      for (const variant of variants) {
        if (!variantsByProduct[variant.product_id]) {
          variantsByProduct[variant.product_id] = []
        }

        variantsByProduct[variant.product_id].push(variant as ProductVariantNew)
      }
    }

    // Combine products with their variants
    const result = products.map((product) => {
      const productVariants = variantsByProduct[product.id] || []

      // Calculate price range
      let minPrice = product.base_price
      let maxPrice = product.base_price

      if (productVariants.length > 0) {
        const prices = productVariants.map((v) => product.base_price + v.price_adjustment)
        minPrice = Math.min(...prices)
        maxPrice = Math.max(...prices)
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        slug: product.slug,
        base_price: product.base_price,
        thumbnail_url: product.thumbnail_url,
        customizable: product.customizable,
        category: product.categories,
        variants: productVariants,
        price_range: {
          min: minPrice,
          max: maxPrice,
          has_variants: productVariants.length > 0,
        },
        created_at: product.created_at,
      }
    })

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    return res.status(200).json({ products: result })
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
