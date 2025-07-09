import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'GET':
        console.log('🔍 [API/admin/products] Fetching products...')
        const { data, error } = await supabaseAdmin
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ [API/admin/products] Error fetching products:', error)
          return res.status(500).json({ error: 'Failed to fetch products' })
        }

        console.log('✅ [API/admin/products] Products fetched successfully:', data?.length || 0)
        res.status(200).json(data || [])
        break

      case 'POST':
        console.log('🔍 [API/admin/products] Creating product...')
        const { error: createError } = await supabaseAdmin
          .from('products')
          .insert([req.body])

        if (createError) {
          console.error('❌ [API/admin/products] Error creating product:', createError)
          return res.status(500).json({ error: 'Failed to create product' })
        }

        console.log('✅ [API/admin/products] Product created successfully')
        res.status(200).json({ success: true })
        break

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('❌ [API/admin/products] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 