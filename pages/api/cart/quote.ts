import type { NextApiRequest, NextApiResponse } from 'next'
import { log } from '@/lib/log'
import type { CartItemInput } from '@/lib/pricing/quoteCart'
import { quoteCart } from '@/lib/pricing/quoteCart'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { cart, shipping_rate_id, promo_code } = req.body as {
    cart: CartItemInput[]
    shipping_rate_id?: string
    promo_code?: string
  }

  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'cart must be a non-empty array' })
  }

  try {
    const quote = await quoteCart(cart, {
      shippingRateId: shipping_rate_id,
      promoCode: promo_code,
    })

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(quote)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    log.error('[cart/quote]', err)
    return res.status(400).json({ error: msg })
  }
}
