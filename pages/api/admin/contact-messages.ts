import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabase = getSupabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      log.error('[admin/contact-messages] Failed to fetch:', error)
      return res.status(500).json({ error: 'Failed to fetch messages' })
    }

    return res.status(200).json(data ?? [])
  }

  if (req.method === 'PATCH') {
    const { id, read } = req.body as { id: number; read: boolean }
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const { error } = await supabase.from('contact_messages').update({ read }).eq('id', id)

    if (error) {
      log.error('[admin/contact-messages] Failed to update:', error)
      return res.status(500).json({ error: 'Failed to update message' })
    }

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const { error } = await supabase.from('contact_messages').delete().eq('id', Number(id))

    if (error) {
      log.error('[admin/contact-messages] Failed to delete:', error)
      return res.status(500).json({ error: 'Failed to delete message' })
    }

    return res.status(200).json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
