import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

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

  const { slug } = req.query

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Product slug is required' })
  }

  try {
    console.log('🔄 [API/products/[slug]] Fetching product:', slug)

    // Fetch product with category information
    const { data: product, error: productError } = await supabase
      .from('products_new')
      .select(`
        id,
        name,
        description,
        slug,
        base_price,
        thumbnail_url,
        images,
        gallery_images,
        is_active,
        customizable,
        attributes,
        created_at,
        updated_at,
        categories!inner(
          id,
          name,
          slug
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (productError) {
      console.error('❌ [API/products/[slug]] Error fetching product:', productError)
      if (productError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' })
      }
      return res.status(500).json({ error: 'Failed to fetch product' })
    }

    if (!product) {
      console.log('⚠️ [API/products/[slug]] Product not found:', slug)
      return res.status(404).json({ error: 'Product not found' })
    }

    console.log('✅ [API/products/[slug]] Product found:', product.name)

    // Fetch variants for this product
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
      console.error('❌ [API/products/[slug]] Error fetching variants:', variantsError)
      return res.status(500).json({ error: 'Failed to fetch variants' })
    }

    console.log('✅ [API/products/[slug]] Variants fetched:', variants?.length || 0)

    // Process variants with final prices
    const processedVariants = variants?.map(variant => ({
      ...variant,
      final_price: product.base_price + variant.price_adjustment
    })) || []

    // Calculate price range
    let minPrice = product.base_price
    let maxPrice = product.base_price
    
    if (processedVariants.length > 0) {
      const prices = processedVariants.map(v => v.final_price)
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
    }

    // Get unique attribute values for variant selectors
    const sizeOptions = [...new Set(processedVariants.map(v => v.size).filter(Boolean))]
    const colorOptions = [...new Set(processedVariants.map(v => v.color).filter(Boolean))]
    const materialOptions = [...new Set(processedVariants.map(v => v.material).filter(Boolean))]

    const result = {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        slug: product.slug,
        base_price: product.base_price,
        thumbnail_url: product.thumbnail_url,
        images: product.images || [],
        gallery_images: product.gallery_images || [],
        customizable: product.customizable,
        attributes: product.attributes || {},
        category: product.categories,
        created_at: product.created_at,
        updated_at: product.updated_at
      },
      variants: processedVariants,
      price_range: {
        min: minPrice,
        max: maxPrice,
        has_variants: processedVariants.length > 0
      },
      variant_options: {
        sizes: sizeOptions,
        colors: colorOptions,
        materials: materialOptions
      }
    }

    console.log('✅ [API/products/[slug]] Returning product with', processedVariants.length, 'variants')

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    
    return res.status(200).json(result)

  } catch (error) {
    console.error('❌ [API/products/[slug]] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
