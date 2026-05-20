import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null

  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const supabase = getSupabaseAdmin()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!userRow) return res.status(404).json({ error: 'User not found' })

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(
      'id, total_price, status, created_at, shipping_name, shipping_address, shipping_city, shipping_postcode, shipping_country, shipping_phone, shipping_method, shipping_cost, tracking_number, tracking_url, shipped_at'
    )
    .eq('user_id', userRow.id)
    .order('created_at', { ascending: false })

  if (ordersError) return res.status(500).json({ error: 'Failed to fetch orders' })
  if (!orders || orders.length === 0) return res.status(200).json([])

  const orderIds = orders.map((o) => o.id)

  const { data: allItems } = await supabase
    .from('order_items')
    .select('id, order_id, quantity, size, price_at_purchase, variant_id, product_id')
    .in('order_id', orderIds)

  const items = allItems || []

  const variantIds = [...new Set(items.map((i) => i.variant_id).filter(Boolean))] as string[]
  const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))] as string[]

  const [variantsRes, productsRes] = await Promise.all([
    variantIds.length > 0
      ? supabase
          .from('product_variants')
          .select('id, size, color, material, image_url')
          .in('id', variantIds)
      : Promise.resolve({
          data: [] as {
            id: string
            size: string | null
            color: string | null
            material: string | null
            image_url: string | null
          }[],
        }),
    productIds.length > 0
      ? supabase.from('products').select('id, name').in('id', productIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const variantMap = new Map((variantsRes.data ?? []).map((v) => [v.id, v]))
  const productMap = new Map((productsRes.data ?? []).map((p) => [p.id, p]))

  type EnrichedItem = {
    id: string
    order_id: string
    quantity: number
    size: string | null
    price_at_purchase: number
    variant_id: string | null
    variant_new?: {
      size: string | null
      color: string | null
      material: string | null
      image_url: string | null
    }
    product_new?: { id: string; name: string }
  }

  const itemsByOrder: Record<string, EnrichedItem[]> = {}
  for (const item of items) {
    const variant = item.variant_id ? variantMap.get(item.variant_id) : null
    const product = item.product_id ? productMap.get(item.product_id) : null
    const enriched: EnrichedItem = {
      id: item.id,
      order_id: item.order_id,
      quantity: item.quantity,
      size: item.size,
      price_at_purchase: Number(item.price_at_purchase),
      variant_id: item.variant_id,
      ...(variant
        ? {
            variant_new: {
              size: variant.size,
              color: variant.color,
              material: variant.material,
              image_url: variant.image_url,
            },
          }
        : {}),
      ...(product ? { product_new: { id: product.id, name: product.name } } : {}),
    }
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    itemsByOrder[item.order_id].push(enriched)
  }

  const result = orders.map((order) => ({
    ...order,
    total_price: Number(order.total_price),
    shipping_cost: order.shipping_cost ? Number(order.shipping_cost) : undefined,
    order_items: itemsByOrder[order.id] || [],
  }))

  return res.status(200).json(result)
}
