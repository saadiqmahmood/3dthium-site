import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'
import { log } from '../../lib/log'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

const SHIPPO_API_URL = 'https://api.goshippo.com'

interface CartItemInput {
  product_id: string
  variant_id?: string | null
  quantity: number
  size?: string | null
  color?: string | null
  material?: string | null
  name: string
  image_url: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      cart,
      email,
      user_id,
      discount,
      promo_code,
      shipping_address,
      shipping_rate_id,
      shipping_cost: client_shipping_cost,
      shipping_provider,
      shipping_service,
    } = req.body as {
      cart: CartItemInput[]
      email: string
      user_id?: string
      discount?: number
      promo_code?: string
      shipping_address?: {
        name: string
        street1: string
        street2?: string
        city: string
        state: string
        zip: string
        country: string
        phone?: string
        email?: string
      }
      shipping_rate_id?: string
      shipping_cost?: number
      shipping_provider?: string
      shipping_service?: string
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: 'Cart is required and cannot be empty' })
    }

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // ── 1. Look up server-side prices from DB ─────────────────────────────────
    const productIds = [...new Set(cart.map((i) => i.product_id))]
    const variantIds = cart.map((i) => i.variant_id).filter(Boolean) as string[]

    const [productsRes, variantsRes] = await Promise.all([
      supabase.from('products').select('id, base_price, is_active').in('id', productIds),
      variantIds.length > 0
        ? supabase
            .from('product_variants')
            .select('id, price_adjustment, is_available')
            .in('id', variantIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (productsRes.error || variantsRes.error) {
      log.error('Error fetching prices:', productsRes.error ?? variantsRes.error)
      return res.status(500).json({ message: 'Failed to verify product prices' })
    }

    const productMap = new Map(productsRes.data?.map((p) => [p.id, p]) ?? [])
    const variantMap = new Map(variantsRes.data?.map((v) => [v.id, v]) ?? [])

    const resolvedItems: Array<CartItemInput & { unit_amount: number }> = []

    for (const item of cart) {
      const product = productMap.get(item.product_id)
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.product_id}` })
      }
      if (!product.is_active) {
        return res.status(400).json({ message: `Product is no longer available: ${item.name}` })
      }

      let unitPrice = Number(product.base_price)

      if (item.variant_id) {
        const variant = variantMap.get(item.variant_id)
        if (!variant) {
          return res.status(400).json({ message: `Variant not found: ${item.variant_id}` })
        }
        if (!variant.is_available) {
          return res
            .status(400)
            .json({ message: `Variant is no longer available for: ${item.name}` })
        }
        unitPrice += Number(variant.price_adjustment)
      }

      resolvedItems.push({ ...item, unit_amount: Math.round(unitPrice * 100) })
    }

    // ── 2. Resolve shipping cost from Shippo — never trust the client ─────────
    let resolvedShippingCost = 0

    if (shipping_rate_id) {
      try {
        const shippoRes = await fetch(`${SHIPPO_API_URL}/rates/${shipping_rate_id}`, {
          headers: { Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}` },
        })
        if (shippoRes.ok) {
          const rate = await shippoRes.json()
          resolvedShippingCost = Math.round(Number(rate.amount) * 100)
        } else {
          // Rate may have expired — fall back to client-provided cost if available
          if (client_shipping_cost != null && client_shipping_cost > 0) {
            log.warn(
              'Shippo rate verification failed, falling back to client cost:',
              shipping_rate_id
            )
            resolvedShippingCost = Math.round(Number(client_shipping_cost) * 100)
          } else {
            return res.status(400).json({
              message: 'Shipping rate has expired. Please go back and recalculate shipping.',
            })
          }
        }
      } catch (err) {
        log.error('Failed to fetch Shippo rate:', err)
        // Network error — fall back to client-provided cost if available
        if (client_shipping_cost != null && client_shipping_cost > 0) {
          resolvedShippingCost = Math.round(Number(client_shipping_cost) * 100)
        } else {
          return res
            .status(400)
            .json({ message: 'Could not verify shipping rate. Please try again.' })
        }
      }
    }

    // ── 3. Persist cart with server-resolved shipping cost ────────────────────
    const checkout_cart_id = uuidv4()
    const { error: insertError } = await supabase.from('checkout_carts').insert({
      id: checkout_cart_id,
      user_id: user_id || null,
      guest_email: user_id ? null : email,
      cart_data: cart,
      shipping_address: shipping_address || null,
      shipping_rate_id: shipping_rate_id || null,
      shipping_cost: resolvedShippingCost / 100,
      shipping_provider: shipping_provider || null,
      shipping_service: shipping_service || null,
    })

    if (insertError) {
      log.error('Error saving checkout cart:', insertError)
      return res.status(500).json({ message: 'Failed to save checkout cart' })
    }

    // ── 4. Build Stripe line items from server-resolved prices ────────────────
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = resolvedItems.map((item) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          description: `Size: ${item.size || 'N/A'}, Color: ${item.color || 'N/A'}, Material: ${item.material || 'N/A'}`,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: item.unit_amount,
      },
      quantity: item.quantity,
    }))

    if (resolvedShippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Shipping', description: 'Shipping and handling' },
          unit_amount: resolvedShippingCost,
        },
        quantity: 1,
      })
    }

    for (const item of lineItems) {
      const amount = item.price_data?.unit_amount ?? 0
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error(`Invalid unit_amount in line item: ${JSON.stringify(item)}`)
      }
    }

    // ── 5. Create Stripe session ───────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout`,
      customer_email: email,
      metadata: {
        checkout_cart_id,
        email,
        user_id: user_id || '',
        promo_code: promo_code || '',
        discount: discount ? discount.toString() : '',
        shipping_rate_id: shipping_rate_id || '',
        shipping_cost: (resolvedShippingCost / 100).toString(),
        shipping_provider: shipping_provider || '',
        shipping_service: shipping_service || '',
      },
      allow_promotion_codes: true,
    })

    res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    log.error('Error creating checkout session:', error)
    res.status(500).json({ message: errMsg || 'Error creating checkout session' })
  }
}
