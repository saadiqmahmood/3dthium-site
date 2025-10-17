import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'GET': {
        console.log('🔍 [API/admin/products] Fetching products...')

        const { data: products, error: productsError } = await supabaseAdmin
          .from('products_new')
          .select(`
            id,
            name,
            description,
            category_id,
            base_price,
            thumbnail_url,
            slug,
            is_active,
            customizable,
            attributes,
            images,
            created_at,
            updated_at,
            categories!inner(name, slug)
          `)
          .order('created_at', { ascending: false })

        if (productsError) {
          console.error('❌ [API/admin/products] Error fetching products:', productsError)
          return res.status(500).json({ error: 'Failed to fetch products' })
        }

        console.log('✅ [API/admin/products] Products fetched successfully:', products?.length || 0)
        res.status(200).json(products || [])
        break
      }

      case 'POST': {
        console.log('🔍 [API/admin/products] Creating new product...')
        const {
          name,
          description,
          category_id,
          base_price,
          thumbnail_url,
          slug,
          is_active,
          customizable,
          attributes,
          images,
          gallery_images,
        } = req.body

        console.log('📝 [API/admin/products] Received data:', {
          name,
          category_id,
          slug,
          imagesCount: images?.length || 0,
          galleryCount: gallery_images?.length || 0,
        })

        if (!name || !description || !category_id || !slug) {
          return res
            .status(400)
            .json({ error: 'Name, description, category, and slug are required' })
        }

        if (base_price <= 0) {
          return res.status(400).json({ error: 'Base price must be greater than 0' })
        }

        if (!images || images.length === 0) {
          return res.status(400).json({ error: 'At least one product image is required' })
        }

        // Check if slug already exists
        const { data: existingProduct, error: checkError } = await supabaseAdmin
          .from('products_new')
          .select('id')
          .eq('slug', slug)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error('❌ [API/admin/products] Error checking slug uniqueness:', checkError)
          return res.status(500).json({ error: 'Failed to check slug uniqueness' })
        }

        if (existingProduct) {
          return res.status(400).json({ error: 'Slug already exists' })
        }

        // Create the product
        const productData = {
          name,
          description,
          category_id,
          base_price,
          thumbnail_url: thumbnail_url || images[0], // Use first image as thumbnail if not specified
          slug,
          is_active: is_active !== undefined ? is_active : true,
          customizable: customizable !== undefined ? customizable : false,
          attributes: attributes || {},
          images: images || [],
          gallery_images: gallery_images || [],
        }

        console.log('💾 [API/admin/products] Inserting product:', productData)

        const { data: newProduct, error: createError } = await supabaseAdmin
          .from('products_new')
          .insert([productData])
          .select()
          .single()

        if (createError) {
          console.error('❌ [API/admin/products] Error creating product:', createError)
          return res.status(500).json({ error: `Failed to create product: ${createError.message}` })
        }

        console.log('✅ [API/admin/products] Product created successfully:', newProduct.id)
        res.status(201).json(newProduct)
        break
      }

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('❌ [API/admin/products] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
