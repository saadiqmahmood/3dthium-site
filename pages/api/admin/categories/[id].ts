import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '../../../../lib/log'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid category ID' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'GET': {
        log.debug('[API/admin/categories/[id]] Fetching category:', id)

        const { data: category, error: fetchError } = await supabaseAdmin
          .from('categories')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) {
          log.error('[API/admin/categories/[id]] Error fetching category:', fetchError)
          return res.status(500).json({ error: 'Failed to fetch category' })
        }

        if (!category) {
          return res.status(404).json({ error: 'Category not found' })
        }

        log.debug('[API/admin/categories/[id]] Category fetched successfully')
        res.status(200).json(category)
        break
      }

      case 'PUT': {
        log.debug('[API/admin/categories/[id]] Updating category:', id)
        const { name, slug, parent_id, description, image_url, sort_order, is_active } = req.body

        if (!name || !slug) {
          return res.status(400).json({ error: 'Name and slug are required' })
        }

        // Check if slug already exists (excluding current category)
        const { data: existingCategory, error: checkError } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          log.error('[API/admin/categories/[id]] Error checking slug uniqueness:', checkError)
          return res.status(500).json({ error: 'Failed to check slug uniqueness' })
        }

        if (existingCategory) {
          return res.status(400).json({ error: 'Slug already exists' })
        }

        // Prevent circular references (category can't be its own parent)
        if (parent_id === id) {
          return res.status(400).json({ error: 'Category cannot be its own parent' })
        }

        // Update the category
        const { data: updatedCategory, error: updateError } = await supabaseAdmin
          .from('categories')
          .update({
            name,
            slug,
            parent_id: parent_id || null,
            description: description || null,
            image_url: image_url || null,
            sort_order: sort_order || 0,
            is_active: is_active !== undefined ? is_active : true,
          })
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          log.error('[API/admin/categories/[id]] Error updating category:', updateError)
          return res.status(500).json({ error: 'Failed to update category' })
        }

        log.debug('[API/admin/categories/[id]] Category updated successfully')
        res.status(200).json(updatedCategory)
        break
      }

      case 'DELETE': {
        log.debug('[API/admin/categories/[id]] Deleting category:', id)

        // Check if category has products
        const { data: products, error: productsError } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq('category_id', id)
          .limit(1)

        if (productsError) {
          log.error('[API/admin/categories/[id]] Error checking products:', productsError)
          return res.status(500).json({ error: 'Failed to check category products' })
        }

        if (products && products.length > 0) {
          return res.status(400).json({
            error:
              'Cannot delete category with existing products. Please reassign or delete products first.',
          })
        }

        // Check if category has subcategories
        const { data: subcategories, error: subcategoriesError } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('parent_id', id)
          .limit(1)

        if (subcategoriesError) {
          log.error('[API/admin/categories/[id]] Error checking subcategories:', subcategoriesError)
          return res.status(500).json({ error: 'Failed to check category subcategories' })
        }

        if (subcategories && subcategories.length > 0) {
          return res.status(400).json({
            error: 'Cannot delete category with subcategories. Please delete subcategories first.',
          })
        }

        // Delete the category
        const { error: deleteError } = await supabaseAdmin.from('categories').delete().eq('id', id)

        if (deleteError) {
          log.error('[API/admin/categories/[id]] Error deleting category:', deleteError)
          return res.status(500).json({ error: 'Failed to delete category' })
        }

        log.debug('[API/admin/categories/[id]] Category deleted successfully')
        res.status(200).json({ success: true })
        break
      }

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    log.error('[API/admin/categories/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
