import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { sendOrderConfirmation } from '../../../lib/email/sendOrderConfirmation'
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
    let order: { id: string; shipping_rate_id: string | null; [key: string]: unknown }
    {
      const { data: inserted, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user_id,
          total_price: session.amount_total ? session.amount_total / 100 : 0,
          guest_email: guest_email,
          stripe_session_id: session.id,
          stripe_payment_intent_id: (session.payment_intent as string) || null,
          stripe_customer_id: (session.customer as string) || null,
          shipping_name: shippingAddress?.name || null,
          shipping_address: shippingAddress?.street1
            ? [shippingAddress.street1, shippingAddress.street2].filter(Boolean).join('\n')
            : null,
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
        if (orderError.code === '23505') {
          // Order already exists — fetch it so we can still sync items
          const { data: existing, error: fetchError } = await supabase
            .from('orders')
            .select()
            .eq('stripe_session_id', session.id)
            .single()
          if (fetchError || !existing) {
            log.error('Error fetching existing order on duplicate:', fetchError)
            return
          }
          order = existing as {
            id: string
            shipping_rate_id: string | null
            [key: string]: unknown
          }
        } else {
          log.error('Error creating order:', orderError)
          return
        }
      } else {
        order = inserted as { id: string; shipping_rate_id: string | null; [key: string]: unknown }
      }
    }

    // Re-fetch server-side prices to store authoritative price_at_purchase
    const productIds = [...new Set((cartItems as CartItem[]).map((i) => i.product_id))]
    const variantIds = (cartItems as CartItem[])
      .map((i) => i.variant_id)
      .filter(Boolean) as string[]

    log.debug('[webhook] cart items count:', (cartItems as CartItem[]).length)
    log.debug('[webhook] productIds:', productIds)
    log.debug('[webhook] variantIds:', variantIds)

    const [productsRes, variantsRes] = await Promise.all([
      supabase.from('products').select('id, base_price').in('id', productIds),
      variantIds.length > 0
        ? supabase.from('product_variants').select('id, price_adjustment').in('id', variantIds)
        : Promise.resolve({
            data: [] as Array<{ id: string; price_adjustment: string }>,
            error: null,
          }),
    ])

    if (productsRes.error) log.error('[webhook] products lookup error:', productsRes.error)
    if (variantsRes.error) log.error('[webhook] variants lookup error:', variantsRes.error)
    log.debug(
      '[webhook] products found:',
      (productsRes.data ?? []).map((p) => p.id)
    )
    log.debug(
      '[webhook] variants found:',
      (variantsRes.data ?? []).map((v) => v.id)
    )

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

    const { data: existingItems } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', order.id)
      .limit(1)

    if (!existingItems || existingItems.length === 0) {
      log.debug('[webhook] inserting order items:', JSON.stringify(orderItems))
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) {
        log.error('[webhook] order_items insert FAILED:', JSON.stringify(itemsError))
        return
      }
    } else {
      log.debug('[webhook] order items already exist, skipping insert:', order.id)
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

    sendOrderConfirmation(order.id).catch((e) =>
      log.error('[webhook] Order confirmation email failed:', e)
    )
  } catch (error) {
    log.error('Error processing checkout session:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  log.debug('Payment intent succeeded:', paymentIntent.id)
  // Additional payment success logic if needed
}
