import { log } from '../../lib/log'
import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CartItem {
  product_id: string
  variant_id?: string | null
  quantity: number
  size?: string | null
  color?: string | null
  material?: string | null
  price: number
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
      shipping_cost,
      shipping_provider,
      shipping_service,
    } = req.body as {
      cart: CartItem[]
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

    // Store cart in checkout_carts table
    const checkout_cart_id = uuidv4()
    const { error: insertError } = await supabase.from('checkout_carts').insert({
      id: checkout_cart_id,
      user_id: user_id || null,
      guest_email: user_id ? null : email,
      cart_data: cart,
      shipping_address: shipping_address || null,
      shipping_rate_id: shipping_rate_id || null,
      shipping_cost: shipping_cost || 0,
      shipping_provider: shipping_provider || null,
      shipping_service: shipping_service || null,
    })
    if (insertError) {
      log.error('Error saving checkout cart:', insertError)
      return res.status(500).json({ message: 'Failed to save checkout cart' })
    }

    // Create line items for Stripe
    const lineItems = cart.map((item: CartItem) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          description: `Size: ${item.size || 'N/A'}, Color: ${item.color || 'N/A'}, Material: ${item.material || 'N/A'}`,
          images: [item.image_url],
        },
        unit_amount: Math.round(item.price * 100), // Use stored price
      },
      quantity: item.quantity,
    }))

    // Add shipping cost as a line item if provided
    if (shipping_cost && shipping_cost > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Shipping',
            description: 'Shipping and handling',
            images: [], // Empty array for shipping
          },
          unit_amount: Math.round(shipping_cost * 100), // Convert to pence
        },
        quantity: 1,
      })
    }

    // Debug: log all line items before sending to Stripe
    log.debug('Line items for Stripe:', JSON.stringify(lineItems, null, 2))
    // Validate all unit_amounts
    for (const item of lineItems) {
      if (
        typeof item.price_data.unit_amount !== 'number' ||
        !Number.isInteger(item.price_data.unit_amount) ||
        item.price_data.unit_amount === 0 ||
        isNaN(item.price_data.unit_amount)
      ) {
        throw new Error(`Invalid unit_amount in line item: ${JSON.stringify(item)}`)
      }
    }

    // Create Stripe checkout session
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
        shipping_cost: shipping_cost ? shipping_cost.toString() : '',
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
