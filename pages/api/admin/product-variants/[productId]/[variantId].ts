import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

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

      // Don't allow updating product_id
      delete updates.product_id

      // Update variant
      const { data: updatedVariant, error } = await supabaseAdmin
        .from('product_variants_new')
        .update(updates)
        .eq('id', variantId)
        .eq('product_id', productId) // Ensure variant belongs to this product
        .select()
        .single()

      if (error) {
        console.error('Error updating variant:', error)

        // Check for unique constraint violation
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'A variant with this size, color, and material combination already exists',
          })
        }

        return res.status(500).json({ error: error.message })
      }

      if (!updatedVariant) {
        return res.status(404).json({ error: 'Variant not found' })
      }

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
