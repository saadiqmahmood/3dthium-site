import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Test 1: Get a recent order
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return res.status(500).json({ error: ordersError.message })
    }

    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: 'No orders found' })
    }

    const orderId = orders[0].id

    // Test 2: Get order items for this order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return res.status(500).json({ error: itemsError.message })
    }

    // Test 3: Get order items with joins
    const { data: orderItemsWithJoins, error: joinsError } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        size,
        price_at_purchase,
        products (
          title
        ),
        product_variants (
          color,
          image_url
        )
      `)
      .eq('order_id', orderId)

    if (joinsError) {
      console.error('Error fetching order items with joins:', joinsError)
      return res.status(500).json({ error: joinsError.message })
    }

    res.status(200).json({
      order: orders[0],
      orderItems: orderItems,
      orderItemsWithJoins: orderItemsWithJoins
    })

  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 