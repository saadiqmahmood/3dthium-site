import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAnon } from '@/lib/supabase/anon'
import { log } from '../../../../lib/log'

const supabase = getSupabaseAnon()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { slug } = req.query

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Product slug is required' })
  }

  try {
    log.debug('[API/products/[slug]/variants] Fetching variants for:', slug)

    // First get the product ID from slug
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, base_price')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (productError) {
      log.error('[API/products/[slug]/variants] Error fetching product:', productError)
      if (productError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' })
      }
      return res.status(500).json({ error: 'Failed to fetch product' })
    }

    if (!product) {
      log.debug('[API/products/[slug]/variants] Product not found:', slug)
      return res.status(404).json({ error: 'Product not found' })
    }

    // Fetch variants for this product
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        size,
        color,
        material,
        price_adjustment,
        is_available,
        sku,
        image_url,
        stock_quantity
      `)
      .eq('product_id', product.id)
      .eq('is_available', true)
      .order('size', { ascending: true })
      .order('color', { ascending: true })
      .order('material', { ascending: true })

    if (variantsError) {
      log.error('[API/products/[slug]/variants] Error fetching variants:', variantsError)
      return res.status(500).json({ error: 'Failed to fetch variants' })
    }

    log.debug('[API/products/[slug]/variants] Variants fetched:', variants?.length || 0)

    // Process variants with final prices
    const processedVariants =
      variants?.map((variant) => ({
        ...variant,
        final_price: Number(product.base_price) + Number(variant.price_adjustment),
      })) || []

    // Get unique attribute values for variant selectors
    const sizeOptions = [...new Set(processedVariants.map((v) => v.size).filter(Boolean))]
    const colorOptions = [...new Set(processedVariants.map((v) => v.color).filter(Boolean))]
    const materialOptions = [...new Set(processedVariants.map((v) => v.material).filter(Boolean))]

    const result = {
      variants: processedVariants,
      base_price: product.base_price,
      variant_options: {
        sizes: sizeOptions,
        colors: colorOptions,
        materials: materialOptions,
      },
    }

    log.debug(`[API/products/[slug]/variants] Returning ${processedVariants.length} variants`)

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    return res.status(200).json(result)
  } catch (error) {
    log.error('[API/products/[slug]/variants] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
