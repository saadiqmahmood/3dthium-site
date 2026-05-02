import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().min(1).max(200).optional(),
  message: z.string().min(10).max(5000),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return err(res, 'Invalid request', 400, parsed.error.flatten().fieldErrors)
  }

  const { name, email, subject, message } = parsed.data

  try {
    const supabase = getSupabaseAdmin()
    const { error: insertError } = await supabase.from('contact_messages').insert({
      name,
      email,
      subject: subject ?? null,
      message,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      log.error('[contact] DB insert failed:', insertError)
      return err(res, 'Failed to save message', 500)
    }

    log.info('[contact] Message received from:', email)
    return ok(res, { message: 'Message received' }, 201)
  } catch (error) {
    log.error('[contact] Unexpected error:', error)
    return err(res, 'Internal server error', 500)
  }
}
