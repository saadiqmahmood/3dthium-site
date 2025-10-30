import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

// Test API endpoint to debug the issue
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
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { slug } = req.query

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Product slug is required' })
  }

  try {
    console.log('🔄 [TEST API] Fetching product:', slug)

    // Test 1: Simple query without join
    const { data: product, error: productError } = await supabase
      .from('products_new')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (productError) {
      console.error('❌ [TEST API] Error fetching product:', productError)
      return res.status(500).json({ error: productError.message })
    }

    if (!product) {
      console.log('❌ [TEST API] Product not found for slug:', slug)
      return res.status(404).json({ error: 'Product not found' })
    }

    console.log('✅ [TEST API] Product found:', product.name)

    // Test 2: Try the join query
    const { data: productWithCategory, error: joinError } = await supabase
      .from('products_new')
      .select(`
        *,
        categories!category_id(
          id,
          name,
          slug
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (joinError) {
      console.error('❌ [TEST API] Error with join:', joinError)
      return res.status(200).json({
        product: product,
        joinError: joinError.message,
        message: 'Product found but join failed',
      })
    }

    return res.status(200).json({
      product: productWithCategory,
      message: 'Product found with category',
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
    console.error('❌ [TEST API] Unexpected error:', errorMessage)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
