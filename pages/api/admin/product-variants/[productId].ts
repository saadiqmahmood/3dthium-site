import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Admin client with elevated privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' })
  }

  // GET: Fetch all variants for a product
  if (req.method === 'GET') {
    try {
      const { data: variants, error } = await supabaseAdmin
        .from('product_variants_new')
        .select('*')
        .eq('product_id', productId)
        .order('size', { ascending: true })
        .order('color', { ascending: true })
        .order('material', { ascending: true })

      if (error) {
        console.error('Error fetching variants:', error)
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json(variants || [])
    } catch (error) {
      console.error('Unexpected error:', error)
      return res.status(500).json({ error: 'Failed to fetch variants' })
    }
  }

  // POST: Create a new variant
  if (req.method === 'POST') {
    try {
      const variantData = req.body

      // Validate at least one attribute is provided
      if (!variantData.size && !variantData.color && !variantData.material) {
        return res.status(400).json({
          error: 'At least one attribute (size, color, or material) is required',
        })
      }

      // Validate price_adjustment is a number
      if (variantData.price_adjustment !== undefined) {
        const adjustment = Number.parseFloat(variantData.price_adjustment)
        if (Number.isNaN(adjustment)) {
          return res.status(400).json({
            error: 'price_adjustment must be a valid number',
          })
        }
        variantData.price_adjustment = adjustment
      } else {
        variantData.price_adjustment = 0
      }

      // Auto-generate SKU if not provided
      if (!variantData.sku) {
        const { data: product } = await supabaseAdmin
          .from('products_new')
          .select('slug')
          .eq('id', productId)
          .single()

        if (product) {
          const skuParts = [
            product.slug.toUpperCase().replace(/-/g, ''),
            variantData.size,
            variantData.color?.substring(0, 3).toUpperCase(),
            variantData.material?.substring(0, 3).toUpperCase(),
          ].filter(Boolean)

          variantData.sku = skuParts.join('-')
        }
      }

      // Set defaults
      if (variantData.stock_quantity === undefined) {
        variantData.stock_quantity = 0 // Print-on-demand by default
      }
      if (variantData.is_available === undefined) {
        variantData.is_available = true
      }

      // Insert variant
      const { data: newVariant, error } = await supabaseAdmin
        .from('product_variants_new')
        .insert([
          {
            product_id: productId,
            ...variantData,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating variant:', error)

        // Check for unique constraint violation
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'A variant with this size, color, and material combination already exists',
          })
        }

        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json(newVariant)
    } catch (error) {
      console.error('Unexpected error:', error)
      return res.status(500).json({ error: 'Failed to create variant' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
