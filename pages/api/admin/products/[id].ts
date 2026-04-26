import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '../../../../lib/log'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid product ID' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'GET': {
        log.debug('[API/admin/products/[id]] Fetching product:', id)

        const { data: product, error: fetchError } = await supabaseAdmin
          .from('products_new')
          .select(`
            id,
            name,
            description,
            category_id,
            base_price,
            thumbnail_url,
            images,
            gallery_images,
            slug,
            is_active,
            customizable,
            attributes,
            created_at,
            updated_at,
            categories(name, slug)
          `)
          .eq('id', id)
          .single()

        if (fetchError) {
          log.error('[API/admin/products/[id]] Error fetching product:', fetchError)
          return res.status(500).json({ error: 'Failed to fetch product' })
        }

        log.debug('[API/admin/products/[id]] Product fetched successfully')
        res.status(200).json(product)
        break
      }

      case 'PUT': {
        log.debug('[API/admin/products/[id]] Updating product:', id)

        const updateData: Record<string, unknown> = {}

        // Only update fields that are provided in the request body
        if (req.body.name !== undefined) updateData.name = req.body.name
        if (req.body.description !== undefined) updateData.description = req.body.description
        if (req.body.category_id !== undefined) updateData.category_id = req.body.category_id
        if (req.body.base_price !== undefined) updateData.base_price = req.body.base_price
        if (req.body.thumbnail_url !== undefined) updateData.thumbnail_url = req.body.thumbnail_url
        if (req.body.images !== undefined) updateData.images = req.body.images
        if (req.body.gallery_images !== undefined)
          updateData.gallery_images = req.body.gallery_images
        if (req.body.slug !== undefined) updateData.slug = req.body.slug
        if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active
        if (req.body.customizable !== undefined) updateData.customizable = req.body.customizable
        if (req.body.attributes !== undefined) updateData.attributes = req.body.attributes

        // If slug is being updated, check for uniqueness
        if (updateData.slug) {
          const { data: existingProduct, error: checkError } = await supabaseAdmin
            .from('products_new')
            .select('id')
            .eq('slug', updateData.slug)
            .neq('id', id)
            .single()

          if (checkError && checkError.code !== 'PGRST116') {
            log.error('[API/admin/products/[id]] Error checking slug uniqueness:', checkError)
            return res.status(500).json({ error: 'Failed to check slug uniqueness' })
          }

          if (existingProduct) {
            return res.status(400).json({ error: 'Slug already exists' })
          }
        }

        // Update timestamp
        updateData.updated_at = new Date().toISOString()

        log.debug('[API/admin/products/[id]] Updating with data:', updateData)

        const { data: updatedProduct, error: updateError } = await supabaseAdmin
          .from('products_new')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          log.error('[API/admin/products/[id]] Error updating product:', updateError)
          return res.status(500).json({ error: `Failed to update product: ${updateError.message}` })
        }

        log.debug('[API/admin/products/[id]] Product updated successfully')
        res.status(200).json(updatedProduct)
        break
      }

      case 'DELETE': {
        log.debug('[API/admin/products/[id]] Deleting product:', id)

        const { error: deleteError } = await supabaseAdmin
          .from('products_new')
          .delete()
          .eq('id', id)

        if (deleteError) {
          log.error('[API/admin/products/[id]] Error deleting product:', deleteError)
          return res.status(500).json({ error: 'Failed to delete product' })
        }

        log.debug('[API/admin/products/[id]] Product deleted successfully')
        res.status(200).json({ success: true })
        break
      }

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    log.error('[API/admin/products/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
