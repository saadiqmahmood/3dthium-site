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
  const { productId, variantId } = req.query

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' })
  }

  if (!variantId || typeof variantId !== 'string') {
    return res.status(400).json({ error: 'Variant ID is required' })
  }

  // PUT: Update a variant
  if (req.method === 'PUT') {
    try {
      const updates = req.body

      // Fetch current variant first to get existing values
      const { data: currentVariant, error: fetchError } = await supabaseAdmin
        .from('product_variants_new')
        .select('size, color, material, sku')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single()

      if (fetchError || !currentVariant) {
        return res.status(404).json({ error: 'Variant not found' })
      }

      // Normalize attributes - convert empty strings to null and trim whitespace
      const normalizedUpdates = normalizeVariantAttributes({
        size: updates.size !== undefined ? updates.size : currentVariant.size,
        color: updates.color !== undefined ? updates.color : currentVariant.color,
        material: updates.material !== undefined ? updates.material : currentVariant.material,
      })

      // Check if at least one attribute will remain after update
      if (
        !hasAtLeastOneAttribute(
          normalizedUpdates.size,
          normalizedUpdates.color,
          normalizedUpdates.material
        )
      ) {
        return res.status(400).json({
          error: 'At least one attribute (size, color, or material) must be provided',
        })
      }

      // Check for duplicate combination BEFORE updating
      // Build the final combination that will exist after update
      const finalSize = updates.size !== undefined ? normalizedUpdates.size : currentVariant.size
      const finalColor = updates.color !== undefined ? normalizedUpdates.color : currentVariant.color
      const finalMaterial =
        updates.material !== undefined ? normalizedUpdates.material : currentVariant.material

      const { data: conflictingVariant, error: checkError } = await supabaseAdmin
        .from('product_variants_new')
        .select('id, size, color, material, sku')
        .eq('product_id', productId)
        .eq('size', finalSize ?? null)
        .eq('color', finalColor ?? null)
        .eq('material', finalMaterial ?? null)
        .neq('id', variantId) // Exclude the current variant
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not an error)
        console.error('❌ [VARIANT UPDATE] Error checking for duplicates:', checkError)
        return res.status(500).json({ error: 'Failed to validate variant update' })
      }

      if (conflictingVariant) {
        console.warn('⚠️ [VARIANT UPDATE] Duplicate variant found:', conflictingVariant)
        return res.status(409).json({
          error: 'Another variant already has this size, color, and material combination',
          conflictingVariant: {
            id: conflictingVariant.id,
            size: conflictingVariant.size,
            color: conflictingVariant.color,
            material: conflictingVariant.material,
            sku: conflictingVariant.sku,
          },
        })
      }

      // Check for SKU collision if SKU is being updated
      if (updates.sku !== undefined && updates.sku !== currentVariant.sku) {
        const newSku = updates.sku === '' ? null : updates.sku.trim()
        if (newSku) {
          const { data: existingSku } = await supabaseAdmin
            .from('product_variants_new')
            .select('id, sku')
            .eq('sku', newSku)
            .neq('id', variantId)
            .single()

          if (existingSku) {
            return res.status(409).json({
              error: `SKU "${newSku}" already exists`,
              existingVariant: { id: existingSku.id, sku: existingSku.sku },
            })
          }
          updates.sku = newSku
        } else {
          updates.sku = null
        }
      }

      // Validate price_adjustment if provided
      if (updates.price_adjustment !== undefined) {
        const adjustment = Number.parseFloat(updates.price_adjustment)
        if (Number.isNaN(adjustment)) {
          return res.status(400).json({
            error: 'price_adjustment must be a valid number',
          })
        }
        updates.price_adjustment = adjustment
      }

      // Don't allow updating product_id or id
      delete updates.product_id
      delete updates.id

      // Apply normalized attribute values to updates
      if (updates.size !== undefined) updates.size = normalizedUpdates.size
      if (updates.color !== undefined) updates.color = normalizedUpdates.color
      if (updates.material !== undefined) updates.material = normalizedUpdates.material

      // Log the update attempt for debugging
      console.log('🔄 [VARIANT UPDATE] Updating variant:', {
        variantId,
        productId,
        updates,
        timestamp: new Date().toISOString(),
      })

      // Update variant
      const { data: updatedVariant, error } = await supabaseAdmin
        .from('product_variants_new')
        .update(updates)
        .eq('id', variantId)
        .eq('product_id', productId) // Ensure variant belongs to this product
        .select()
        .single()

      if (error) {
        console.error('❌ [VARIANT UPDATE] Error updating variant:', {
          variantId,
          productId,
          error: error.message,
          code: error.code,
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

        return res.status(500).json({ error: error.message })
      }

      if (!updatedVariant) {
        console.warn('⚠️ [VARIANT UPDATE] Variant not found after update:', {
          variantId,
          productId,
        })
        return res.status(404).json({ error: 'Variant not found' })
      }

      console.log('✅ [VARIANT UPDATE] Variant updated successfully:', {
        variantId: updatedVariant.id,
        productId,
        size: updatedVariant.size,
        color: updatedVariant.color,
        material: updatedVariant.material,
      })

      return res.status(200).json(updatedVariant)
    } catch (error) {
      console.error('Unexpected error:', error)
      return res.status(500).json({ error: 'Failed to update variant' })
    }
  }

  // DELETE: Delete a variant
  if (req.method === 'DELETE') {
    try {
      // Delete the variant
      const { error } = await supabaseAdmin
        .from('product_variants_new')
        .delete()
        .eq('id', variantId)
        .eq('product_id', productId) // Ensure variant belongs to this product

      if (error) {
        console.error('Error deleting variant:', error)
        return res.status(500).json({ error: error.message })
      }

      // Check if there are any remaining variants for this product
      const { count, error: countError } = await supabaseAdmin
        .from('product_variants_new')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)

      if (countError) {
        console.error('Error checking remaining variants:', countError)
        // Don't fail the deletion, just log the error
      } else if (count === 0) {
        // No variants remaining - clean up attributes and options
        console.log(
          '🧹 [VARIANT DELETE] No variants remaining, cleaning up attributes for product:',
          productId
        )

        // Delete all attributes (options will cascade delete)
        const { error: attrError } = await supabaseAdmin
          .from('product_attributes')
          .delete()
          .eq('product_id', productId)

        if (attrError) {
          console.error('Error cleaning up attributes:', attrError)
          // Don't fail the deletion, just log the error
        } else {
          console.log('✅ [VARIANT DELETE] Attributes cleaned up successfully')
        }
      }

      return res.status(200).json({ message: 'Variant deleted successfully' })
    } catch (error) {
      console.error('Unexpected error:', error)
      return res.status(500).json({ error: 'Failed to delete variant' })
    }
  }

  // GET: Fetch a single variant (bonus endpoint)
  if (req.method === 'GET') {
    try {
      const { data: variant, error } = await supabaseAdmin
        .from('product_variants_new')
        .select('*')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single()

      if (error) {
        console.error('Error fetching variant:', error)
        return res.status(500).json({ error: error.message })
      }

      if (!variant) {
        return res.status(404).json({ error: 'Variant not found' })
      }

      return res.status(200).json(variant)
    } catch (error) {
      console.error('Unexpected error:', error)
      return res.status(500).json({ error: 'Failed to fetch variant' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
