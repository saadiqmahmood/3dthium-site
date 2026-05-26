import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('site_settings').select('key, value')

  if (error) return res.status(500).json({ error: 'Failed to fetch settings' })

  const settings = Object.fromEntries((data ?? []).map(({ key, value }) => [key, value]))
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  res.status(200).json(settings)
}
