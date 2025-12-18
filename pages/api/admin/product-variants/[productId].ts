import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  normalizeVariantAttributes,
  hasAtLeastOneAttribute,
} from '@/utils/variantHelpers'

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

      console.log('🔍 [VARIANT CREATE] Starting creation:', {
        productId,
        variantData,
        timestamp: new Date().toISOString(),
      })

      // Normalize attributes (empty strings to null, trim whitespace)
      const normalized = normalizeVariantAttributes({
        size: variantData.size,
        color: variantData.color,
        material: variantData.material,
      })

      // Validate at least one attribute is provided
      if (!hasAtLeastOneAttribute(normalized.size, normalized.color, normalized.material)) {
        console.error('❌ [VARIANT CREATE] Validation failed: No attributes provided')
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

      // Check for duplicate variant combination BEFORE attempting insert
      const { data: existingVariant, error: checkError } = await supabaseAdmin
        .from('product_variants_new')
        .select('id, size, color, material, sku')
        .eq('product_id', productId)
        .eq('size', normalized.size ?? null)
        .eq('color', normalized.color ?? null)
        .eq('material', normalized.material ?? null)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not an error, means no duplicate)
        console.error('❌ [VARIANT CREATE] Error checking for duplicates:', checkError)
        return res.status(500).json({ error: 'Failed to validate variant' })
      }

      if (existingVariant) {
        console.warn('⚠️ [VARIANT CREATE] Duplicate variant found:', existingVariant)
        return res.status(409).json({
          error: 'A variant with this size, color, and material combination already exists',
          existingVariant: {
            id: existingVariant.id,
            size: existingVariant.size,
            color: existingVariant.color,
            material: existingVariant.material,
            sku: existingVariant.sku,
          },
        })
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
            normalized.size,
            normalized.color?.substring(0, 3).toUpperCase(),
            normalized.material?.substring(0, 3).toUpperCase(),
          ].filter(Boolean)

          const baseSku = skuParts.join('-')
          let proposedSku = baseSku
          let counter = 1

          // Check for SKU collision and append counter if needed
          const { data: existingSku } = await supabaseAdmin
            .from('product_variants_new')
            .select('id')
            .eq('sku', proposedSku)
            .single()

          while (existingSku) {
            proposedSku = `${baseSku}-${counter}`
            const { data: checkSku } = await supabaseAdmin
              .from('product_variants_new')
              .select('id')
              .eq('sku', proposedSku)
              .single()
            if (!checkSku) break
            counter++
          }

          variantData.sku = proposedSku
        }
      } else {
        // Check if provided SKU already exists
        const { data: existingSku } = await supabaseAdmin
          .from('product_variants_new')
          .select('id, sku')
          .eq('sku', variantData.sku)
          .single()

        if (existingSku) {
          return res.status(409).json({
            error: `SKU "${variantData.sku}" already exists`,
            existingVariant: { id: existingSku.id, sku: existingSku.sku },
          })
        }
      }

      // Set defaults
      if (variantData.stock_quantity === undefined) {
        variantData.stock_quantity = 0 // Print-on-demand by default
      }
      if (variantData.is_available === undefined) {
        variantData.is_available = true
      }

      // Prepare final variant data with normalized attributes
      const finalVariantData = {
        ...variantData,
        size: normalized.size,
        color: normalized.color,
        material: normalized.material,
      }

      console.log('💾 [VARIANT CREATE] Attempting insert:', {
        product_id: productId,
        ...finalVariantData,
      })

      // Insert variant
      const { data: newVariant, error } = await supabaseAdmin
        .from('product_variants_new')
        .insert([
          {
            product_id: productId,
            ...finalVariantData,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('❌ [VARIANT CREATE] Database error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })

        // Fallback: Check for unique constraint violation (shouldn't happen with pre-check)
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'A variant with this combination or SKU already exists',
            details: error.details,
          })
        }

        return res.status(500).json({
          error: error.message,
          details: error.details,
          hint: error.hint,
        })
      }

      console.log('✅ [VARIANT CREATE] Success:', {
        variantId: newVariant?.id,
        sku: newVariant?.sku,
      })

      return res.status(201).json(newVariant)
    } catch (error) {
      console.error('Unexpected error:', error)
      return res.status(500).json({ error: 'Failed to create variant' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
