import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false } }
    )

    const { error } = await supabase.from('categories').select('id').limit(1)

    if (error) {
      return res.status(503).json({ status: 'degraded', db: 'error' })
    }

    return res.status(200).json({ status: 'ok', db: 'connected' })
  } catch {
    return res.status(503).json({ status: 'error', db: 'unreachable' })
  }
}
