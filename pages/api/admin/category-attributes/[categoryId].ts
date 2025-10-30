import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { categoryId } = req.query

  if (!categoryId || typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'Invalid category ID' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    console.log('🔍 [API/admin/category-attributes] Fetching attributes for category:', categoryId)

    const { data: attributes, error } = await supabaseAdmin
      .from('category_attributes')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ [API/admin/category-attributes] Error fetching attributes:', error)
      return res.status(500).json({ error: 'Failed to fetch category attributes' })
    }

    console.log(
      '✅ [API/admin/category-attributes] Attributes fetched successfully:',
      attributes?.length || 0
    )
    res.status(200).json(attributes || [])
  } catch (error) {
    console.error('❌ [API/admin/category-attributes] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
