import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '../../../../lib/log'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { categoryId } = req.query

  if (!categoryId || typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'Invalid category ID' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    log.debug('[API/admin/category-attributes] Fetching attributes for category:', categoryId)

    const { data: attributes, error } = await supabaseAdmin
      .from('category_attributes')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true })

    if (error) {
      log.error('[API/admin/category-attributes] Error fetching attributes:', error)
      return res.status(500).json({ error: 'Failed to fetch category attributes' })
    }

    log.debug(
      '[API/admin/category-attributes] Attributes fetched successfully:',
      attributes?.length || 0
    )
    res.status(200).json(attributes || [])
  } catch (error) {
    log.error('[API/admin/category-attributes] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
