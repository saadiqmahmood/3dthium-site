import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

interface Product {
  id: string;
  title: string;
}

interface Variant {
  id: string;
  color: string;
  price: number;
  image_url: string;
  customizable?: boolean;
}

interface CartItem {
  product: Product;
  variant: Variant;
  quantity: number;
  size: string;
}

// Helper function for dynamic price calculation
function getDynamicPrice(variant: { color: string }, size: string): number {
  let basePrice = 16.99;
  if (variant.color && variant.color.includes('And')) {
    basePrice = 17.99;
  }
  if (size === '210mm') {
    return basePrice - 4;
  } else if (size === '180mm') {
    return basePrice - 7;
  } else if (size === '150mm') {
    return basePrice - 10;
  } else if (size === '240mm') {
    return basePrice;
  }
  return basePrice;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ message: 'Webhook signature verification failed' })
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
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    res.status(500).json({ message: 'Webhook handler failed' })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing completed checkout session:', session.id)

  const checkout_cart_id = session.metadata?.checkout_cart_id
  if (!checkout_cart_id) {
    console.error('Missing checkout_cart_id in session metadata:', session.id)
    return
  }

  // Look up the cart in checkout_carts
  const { data: checkoutCart, error: cartError } = await supabase
    .from('checkout_carts')
    .select('*')
    .eq('id', checkout_cart_id)
    .single()

  if (cartError || !checkoutCart) {
    console.error('Could not find checkout cart:', cartError)
    return
  }

  const cartItems = checkoutCart.cart_data
  const auth_user_id = checkoutCart.user_id || null
  const guest_email = !auth_user_id ? (checkoutCart.guest_email || session.customer_email || null) : null
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
      console.error('Error looking up user record:', userError)
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
        stripe_payment_intent_id: session.payment_intent as string || null,
        stripe_customer_id: session.customer as string || null,
        // Shipping information
        shipping_name: shippingAddress?.name || null,
        shipping_address: shippingAddress?.street1 || null,
        shipping_city: shippingAddress?.city || null,
        shipping_postcode: shippingAddress?.zip || null,
        shipping_country: shippingAddress?.country || 'GB',
        shipping_phone: shippingAddress?.phone || null,
        shipping_method: (shippingProvider && shippingService) ? `${shippingProvider}: ${shippingService}` : null,
        shipping_rate_id: shippingRateId || null,
        shipping_cost: shippingCost,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return
    }

    // Create order items - match the actual database schema
    const orderItems = (cartItems as CartItem[]).map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      variant_id: item.variant.id,
      quantity: item.quantity,
      size: item.size,
      price_at_purchase: getDynamicPrice(item.variant, item.size), // Use dynamic price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      return
    }

    console.log('Order created successfully:', order.id)
    // Optionally: send confirmation email, update inventory, etc.

    // AUTOMATE SHIPPING LABEL CREATION
    if (order.shipping_rate_id && order.id) {
      try {
        const labelUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/shipping/label`
        const labelRes = await fetch(labelUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rate_id: order.shipping_rate_id,
            order_id: order.id,
          }),
        })
        const labelData = await labelRes.json().catch(e => ({ error: 'Invalid JSON', details: e }))
        if (!labelRes.ok || !labelData.success) {
          console.error('[AutoLabel] Auto label creation failed:', labelData.error || labelData)
        }
      } catch (err) {
        console.error('[AutoLabel] Error auto-creating shipping label:', err)
      }
    }
  } catch (error) {
    console.error('Error processing checkout session:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id)
  // Additional payment success logic if needed
} 