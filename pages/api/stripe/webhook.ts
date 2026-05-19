import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { log } from '../../../lib/log'
import { applyPromoCode } from '../promo_code/apply'
import { createLabelForOrder } from '../shipping/label'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string

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

  // Fail closed — never process events if the signing secret is absent.
  if (!endpointSecret) {
    log.error('STRIPE_WEBHOOK_SECRET is not set')
    return res.status(500).json({ message: 'Webhook secret not configured' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret)
  } catch (err) {
    log.error('Webhook signature verification failed:', err)
    return res.status(400).json({ message: 'Webhook signature verification failed' })
  }

  // Idempotency: record the event ID and skip if already processed.
  const { error: insertError } = await supabase
    .from('stripe_webhook_events')
    .insert({ id: event.id, type: event.type, payload: event })

  if (insertError) {
    if (insertError.code === '23505') {
      // Duplicate — already handled.
      log.debug('Duplicate Stripe event, skipping:', event.id)
      return res.status(200).json({ received: true, duplicate: true })
    }
    log.error('Failed to record webhook event:', insertError)
    return res.status(500).json({ message: 'Failed to record event' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      default:
        log.debug(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    log.error('Webhook handler error:', error)
    res.status(500).json({ message: 'Webhook handler failed' })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  log.debug('Processing completed checkout session:', session.id)

  const checkout_cart_id = session.metadata?.checkout_cart_id
  if (!checkout_cart_id) {
    log.error('Missing checkout_cart_id in session metadata:', session.id)
    return
  }

  // Look up the cart in checkout_carts
  const { data: checkoutCart, error: cartError } = await supabase
    .from('checkout_carts')
    .select('*')
    .eq('id', checkout_cart_id)
    .single()

  if (cartError || !checkoutCart) {
    log.error('Could not find checkout cart:', cartError)
    return
  }

  const cartItems = checkoutCart.cart_data
  const auth_user_id = checkoutCart.user_id || null
  const guest_email = !auth_user_id
    ? checkoutCart.guest_email || session.customer_email || null
    : null
  const shippingAddress = checkoutCart.shipping_address
  const shippingRateId = checkoutCart.shipping_rate_id
  const shippingCost = checkoutCart.shipping_cost || 0
  const shippingProvider = checkoutCart.shipping_provider
  const shippingService = checkoutCart.shipping_service

  // If we have an auth_user_id, look up the corresponding user record
  let user_id = null
  if (auth_user_id) {
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', auth_user_id)
      .single()

    if (userError) {
      log.error('Error looking up user record:', userError)
      // Continue with guest checkout if user lookup fails
    } else if (userRecord) {
      user_id = userRecord.id
    }
  }

  try {
    // Create order record - match the actual database schema
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user_id,
        total_price: session.amount_total ? session.amount_total / 100 : 0, // Convert from pence
        guest_email: guest_email,
        stripe_session_id: session.id,
        stripe_payment_intent_id: (session.payment_intent as string) || null,
        stripe_customer_id: (session.customer as string) || null,
        // Shipping information
        shipping_name: shippingAddress?.name || null,
        shipping_address: shippingAddress?.street1 || null,
        shipping_city: shippingAddress?.city || null,
        shipping_postcode: shippingAddress?.zip || null,
        shipping_country: shippingAddress?.country || 'GB',
        shipping_phone: shippingAddress?.phone || null,
        shipping_method:
          shippingProvider && shippingService ? `${shippingProvider}: ${shippingService}` : null,
        shipping_rate_id: shippingRateId || null,
        shipping_cost: shippingCost,
      })
      .select()
      .single()

    if (orderError) {
      log.error('Error creating order:', orderError)
      return
    }

    // Re-fetch server-side prices to store authoritative price_at_purchase
    const productIds = [...new Set((cartItems as CartItem[]).map((i) => i.product_id))]
    const variantIds = (cartItems as CartItem[])
      .map((i) => i.variant_id)
      .filter(Boolean) as string[]

    const [productsRes, variantsRes] = await Promise.all([
      supabase.from('products').select('id, base_price').in('id', productIds),
      variantIds.length > 0
        ? supabase.from('product_variants').select('id, price_adjustment').in('id', variantIds)
        : Promise.resolve({ data: [] as Array<{ id: string; price_adjustment: string }> }),
    ])

    const productMap = new Map((productsRes.data ?? []).map((p) => [p.id, Number(p.base_price)]))
    const variantMap = new Map(
      (variantsRes.data ?? []).map((v) => [v.id, Number(v.price_adjustment)])
    )

    const orderItems = (cartItems as CartItem[]).map((item) => {
      const basePrice = productMap.get(item.product_id) ?? 0
      const adjustment = item.variant_id ? (variantMap.get(item.variant_id) ?? 0) : 0
      return {
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        size: item.size || null,
        price_at_purchase: basePrice + adjustment,
      }
    })

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      log.error('Error creating order items:', itemsError)
      return
    }

    log.debug('Order created successfully:', order.id)

    const promoCode = session.metadata?.promo_code
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('id')
        .eq('code', promoCode)
        .single()
      if (promo) {
        await applyPromoCode(promo.id)
      }
    }

    if (order.shipping_rate_id) {
      const labelResult = await createLabelForOrder(order.shipping_rate_id, order.id)
      if (!labelResult.success) {
        log.error('[AutoLabel] Auto label creation failed:', labelResult.error)
      }
    }
  } catch (error) {
    log.error('Error processing checkout session:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  log.debug('Payment intent succeeded:', paymentIntent.id)
  // Additional payment success logic if needed
}
