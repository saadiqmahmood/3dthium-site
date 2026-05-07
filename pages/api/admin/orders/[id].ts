import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { log } from '../../../../lib/log'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid order ID' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'GET': {
        log.debug('[API/admin/orders/[id]] Fetching order details:', id)

        // First fetch order with old schema items
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select(
            `id, user_id, guest_email, total_price, status, created_at, shipping_name, shipping_address, shipping_city, shipping_postcode, shipping_country, shipping_phone, shipping_method, shipping_rate_id, shipping_cost, tracking_number, tracking_url, shipped_at, shipping_label_url, order_items(id, quantity, size, price_at_purchase, variant_id, product_id, products_legacy(id, title), product_variants_legacy(id, color, image_url))`
          )
          .eq('id', id)
          .single()

        if (error || !data) {
          log.error('[API/admin/orders/[id]] Error fetching order:', error)
          return res.status(500).json({ error: 'Failed to fetch order' })
        }

        // Enrich order items with product_variants and products data (batch, no N+1)
        if (data.order_items && Array.isArray(data.order_items)) {
          type RawItem = {
            id: string
            quantity: number
            size: string | null
            price_at_purchase: number
            variant_id?: string
            product_id?: string
            products_legacy?: unknown
            product_variants_legacy?: unknown
          }
          const items = data.order_items as RawItem[]

          const variantIds = items.map((i) => i.variant_id).filter(Boolean) as string[]
          const productIds = items.map((i) => i.product_id).filter(Boolean) as string[]

          const [variantsRes, productsRes] = await Promise.all([
            variantIds.length > 0
              ? supabaseAdmin
                  .from('product_variants')
                  .select('id, size, color, material, image_url')
                  .in('id', variantIds)
              : Promise.resolve({ data: [] }),
            productIds.length > 0
              ? supabaseAdmin.from('products').select('id, name').in('id', productIds)
              : Promise.resolve({ data: [] }),
          ])

          const variantMap = new Map(
            (variantsRes.data ?? []).map(
              (v: {
                id: string
                size: string | null
                color: string | null
                material: string | null
                image_url: string | null
              }) => [v.id, v]
            )
          )
          const productMap = new Map(
            (productsRes.data ?? []).map((p: { id: string; name: string }) => [p.id, p])
          )

          data.order_items = items.map((item) => {
            const variant = item.variant_id ? variantMap.get(item.variant_id) : null
            const product = item.product_id ? productMap.get(item.product_id) : null
            return {
              ...item,
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
            // biome-ignore lint/suspicious/noExplicitAny: heterogeneous order-items union shape
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any[]
        }

        log.debug('[API/admin/orders/[id]] Order details fetched successfully')
        res.status(200).json(data)
        break
      }

      case 'PUT': {
        log.debug('[API/admin/orders/[id]] Updating order:', id)
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update(req.body)
          .eq('id', id)

        if (updateError) {
          log.error('[API/admin/orders/[id]] Error updating order:', updateError)
          return res.status(500).json({ error: 'Failed to update order' })
        }

        log.debug('[API/admin/orders/[id]] Order updated successfully')
        res.status(200).json({ success: true })
        break
      }

      case 'DELETE': {
        log.debug('[API/admin/orders/[id]] Deleting order:', id)
        const { error: deleteError } = await supabaseAdmin.from('orders').delete().eq('id', id)

        if (deleteError) {
          log.error('[API/admin/orders/[id]] Error deleting order:', deleteError)
          return res.status(500).json({ error: 'Failed to delete order' })
        }

        log.debug('[API/admin/orders/[id]] Order deleted successfully')
        res.status(200).json({ success: true })
        break
      }

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    log.error('[API/admin/orders/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
