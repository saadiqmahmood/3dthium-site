import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '../../../lib/log'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'GET': {
        log.debug('[API/admin/categories] Fetching categories...')

        // Fetch all categories with product counts
        const { data: categories, error: categoriesError } = await supabaseAdmin
          .from('categories')
          .select(`
            id,
            name,
            slug,
            parent_id,
            description,
            image_url,
            sort_order,
            is_active,
            created_at,
            updated_at
          `)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true })

        if (categoriesError) {
          log.error('[API/admin/categories] Error fetching categories:', categoriesError)
          return res.status(500).json({ error: 'Failed to fetch categories' })
        }

        // Fetch product counts for each category
        const { data: productCounts, error: countsError } = await supabaseAdmin
          .from('products_new')
          .select('category_id')
          .eq('is_active', true)

        if (countsError) {
          log.error('[API/admin/categories] Error fetching product counts:', countsError)
          // Continue without counts rather than failing completely
        }

        // Calculate product counts
        const categoryCounts: Record<string, number> = {}
        if (productCounts) {
          productCounts.forEach((product) => {
            if (product.category_id) {
              categoryCounts[product.category_id] = (categoryCounts[product.category_id] || 0) + 1
            }
          })
        }

        // Add product counts to categories
        const categoriesWithCounts =
          categories?.map((category) => ({
            ...category,
            product_count: categoryCounts[category.id] || 0,
          })) || []

        log.debug(
          '[API/admin/categories] Categories fetched successfully:',
          categoriesWithCounts.length
        )
        res.status(200).json(categoriesWithCounts)
        break
      }

      case 'POST': {
        log.debug('[API/admin/categories] Creating new category...')
        const { name, slug, parent_id, description, image_url, sort_order, is_active } = req.body

        if (!name || !slug) {
          return res.status(400).json({ error: 'Name and slug are required' })
        }

        // Check if slug already exists
        const { data: existingCategory, error: checkError } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('slug', slug)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          log.error('[API/admin/categories] Error checking slug uniqueness:', checkError)
          return res.status(500).json({ error: 'Failed to check slug uniqueness' })
        }

        if (existingCategory) {
          return res.status(400).json({ error: 'Slug already exists' })
        }

        // Create the category
        const { data: newCategory, error: createError } = await supabaseAdmin
          .from('categories')
          .insert([
            {
              name,
              slug,
              parent_id: parent_id || null,
              description: description || null,
              image_url: image_url || null,
              sort_order: sort_order || 0,
              is_active: is_active !== undefined ? is_active : true,
            },
          ])
          .select()
          .single()

        if (createError) {
          log.error('[API/admin/categories] Error creating category:', createError)
          return res.status(500).json({ error: 'Failed to create category' })
        }

        log.debug('[API/admin/categories] Category created successfully:', newCategory.id)
        res.status(201).json(newCategory)
        break
      }

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    log.error('[API/admin/categories] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
