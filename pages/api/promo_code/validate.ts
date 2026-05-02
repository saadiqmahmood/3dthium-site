import type { NextApiRequest, NextApiResponse } from 'next'
import type { PromoCode } from '@/lib/pricing/applyPromo'
import { validatePromo } from '@/lib/pricing/applyPromo'
import { getSupabaseAnon } from '@/lib/supabase/anon'

const supabase = getSupabaseAnon()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { code, orderTotal } = req.body as {
    code: string
    orderTotal: number
  }

  if (!code || typeof orderTotal !== 'number') {
    return res.status(400).json({ message: 'Code and orderTotal are required' })
  }

  const { data: promo, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (error || !promo) {
    return res.status(404).json({ valid: false, message: 'Promo code not found' })
  }

  const result = validatePromo(promo as PromoCode, orderTotal)

  if (!result.valid) {
    return res.status(400).json(result)
  }

  return res.status(200).json({ ...result, message: 'Promo code valid' })
}
