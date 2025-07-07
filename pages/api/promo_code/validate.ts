import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { code, orderTotal, apply } = req.body as {
    code: string
    orderTotal: number
    apply?: boolean
  }

  if (!code || typeof orderTotal !== 'number') {
    return res.status(400).json({ message: 'Code and orderTotal are required' })
  }

  // Fetch promo code
  const { data: promo, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim())
    .single()

  if (error || !promo) {
    return res.status(404).json({ valid: false, message: 'Promo code not found' })
  }

  // Check active
  if (!promo.active) {
    return res.status(400).json({ valid: false, message: 'Promo code is not active' })
  }

  // Check expiry
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return res.status(400).json({ valid: false, message: 'Promo code has expired' })
  }

  // Check usage limit
  if (promo.max_uses !== null && promo.uses >= promo.max_uses) {
    return res.status(400).json({ valid: false, message: 'Promo code usage limit reached' })
  }

  // Check min order value
  if (promo.min_order_value !== null && orderTotal < promo.min_order_value) {
    return res.status(400).json({ valid: false, message: `Minimum order value for this code is £${promo.min_order_value}` })
  }

  // Calculate discount
  let discountAmount = 0
  if (promo.type === 'percentage') {
    discountAmount = (orderTotal * promo.value) / 100
  } else if (promo.type === 'fixed') {
    discountAmount = promo.value
  }
  // Don't allow discount to exceed order total
  discountAmount = Math.min(discountAmount, orderTotal)

  // If apply is true, increment uses
  if (apply) {
    const { error: updateError } = await supabase
      .from('promo_codes')
      .update({ uses: promo.uses + 1 })
      .eq('id', promo.id)
    if (updateError) {
      return res.status(500).json({ valid: false, message: 'Failed to apply promo code' })
    }
  }

  return res.status(200).json({
    valid: true,
    type: promo.type,
    value: promo.value,
    discountAmount,
    message: 'Promo code applied',
    code: promo.code,
    promoId: promo.id,
    ...(apply ? { applied: true } : {})
  })
} 