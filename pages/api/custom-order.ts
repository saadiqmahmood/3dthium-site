import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { err, ok } from '@/lib/api/respond'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

const SUPABASE_STORAGE_HOST = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL as string).hostname

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  material: z.string().min(1).max(100),
  address: z.string().min(1).max(500),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  depth: z.number().int().positive().optional(),
  description: z.string().min(10).max(5000),
  file_url: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          return new URL(url).hostname === SUPABASE_STORAGE_HOST
        } catch {
          return false
        }
      },
      { message: 'file_url must point to Supabase Storage' }
    )
    .optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return err(res, 'Invalid request', 400, parsed.error.flatten().fieldErrors)
  }

  const { name, email, phone, material, address, width, height, depth, description, file_url } =
    parsed.data

  try {
    const supabase = getSupabaseAdmin()
    const { error: insertError } = await supabase.from('custom_orders').insert([
      {
        name,
        email,
        phone: phone ?? null,
        material,
        address,
        width: width ?? null,
        height: height ?? null,
        depth: depth ?? null,
        description,
        file_url: file_url ?? null,
        status: 'pending',
      },
    ])

    if (insertError) {
      log.error('[custom-order] Insert failed:', insertError)
      return err(res, 'Failed to submit custom order', 500)
    }

    log.info('[custom-order] Received from:', email)
    return ok(res, { message: 'Custom order received' }, 201)
  } catch (error) {
    log.error('[custom-order] Unexpected error:', error)
    return err(res, 'Internal server error', 500)
  }
}
