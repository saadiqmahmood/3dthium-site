import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

const ALLOWED_KEYS = ['accordion_materials_printing', 'accordion_delivery_returns'] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabase = getSupabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('site_settings').select('key, value')
    if (error) return res.status(500).json({ error: 'Failed to fetch settings' })
    return res
      .status(200)
      .json(Object.fromEntries((data ?? []).map(({ key, value }) => [key, value])))
  }

  if (req.method === 'PUT') {
    const updates = req.body as Record<string, string>
    const invalid = Object.keys(updates).filter(
      (k) => !(ALLOWED_KEYS as readonly string[]).includes(k)
    )
    if (invalid.length > 0)
      return res.status(400).json({ error: `Unknown keys: ${invalid.join(', ')}` })

    const rows = Object.entries(updates).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' })
    if (error) {
      log.error('[admin/site-settings] Failed to save:', error)
      return res.status(500).json({ error: 'Failed to save settings' })
    }

    log.info('[admin/site-settings] Settings updated')
    return res.status(200).json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
