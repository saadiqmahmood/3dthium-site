import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { sendContactReply } from '@/lib/email/sendContactReply'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id, body } = req.body as { id: number; body: string }

  if (!id || typeof id !== 'number') {
    return res.status(400).json({ error: 'Missing message id' })
  }
  if (!body || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ error: 'Reply body is required' })
  }

  const supabase = getSupabaseAdmin()

  const { data: message, error: fetchError } = await supabase
    .from('contact_messages')
    .select('id, name, email, subject')
    .eq('id', id)
    .single()

  if (fetchError || !message) {
    log.error('[admin/contact-messages/reply] Message not found:', id)
    return res.status(404).json({ error: 'Message not found' })
  }

  const result = await sendContactReply({
    to: message.email,
    toName: message.name,
    subject: message.subject,
    replyBody: body.trim(),
  })

  if (!result.success) {
    return res.status(500).json({ error: result.error ?? 'Failed to send reply' })
  }

  const { error: updateError } = await supabase
    .from('contact_messages')
    .update({ replied_at: new Date().toISOString(), reply_body: body.trim(), read: true })
    .eq('id', id)

  if (updateError) {
    log.error('[admin/contact-messages/reply] Failed to update replied_at:', updateError)
  }

  return res.status(200).json({ success: true })
}
