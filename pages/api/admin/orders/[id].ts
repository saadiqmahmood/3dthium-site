import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid order ID' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'GET': {
        console.log('🔍 [API/admin/orders/[id]] Fetching order details:', id)
        
        // First fetch order with old schema items
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select(
            `id, user_id, guest_email, total_price, status, created_at, shipping_name, shipping_address, shipping_city, shipping_postcode, shipping_country, shipping_phone, shipping_method, shipping_rate_id, shipping_cost, tracking_number, tracking_url, shipped_at, shipping_label_url, order_items(id, quantity, size, price_at_purchase, variant_id, product_id, products(id, title), product_variants(id, color, image_url))`
          )
          .eq('id', id)
          .single()

        if (error || !data) {
          console.error('❌ [API/admin/orders/[id]] Error fetching order:', error)
          return res.status(500).json({ error: 'Failed to fetch order' })
        }

        // Enrich order items with product_variants_new data if available
        if (data.order_items && Array.isArray(data.order_items)) {
          const enrichedItems = await Promise.all(
            data.order_items.map(async (item: {
              id: string
              quantity: number
              size: string | null
              price_at_purchase: number
              variant_id?: string
              product_id?: string
              products?: unknown
              product_variants?: unknown
            }) => {
              const enrichedItem = { ...item }
              
              if (item.variant_id) {
                // Try fetching from product_variants_new first
                const { data: newVariant } = await supabaseAdmin
                  .from('product_variants_new')
                  .select('id, size, color, material, image_url, price_adjustment')
                  .eq('id', item.variant_id)
                  .single()

                if (newVariant) {
                  // Fetch product from products_new for consistency
                  const { data: newProduct } = await supabaseAdmin
                    .from('products_new')
                    .select('id, name')
                    .eq('id', item.product_id)
                    .single()

                  Object.assign(enrichedItem, {
                    variant_new: {
                      size: newVariant.size,
                      color: newVariant.color,
                      material: newVariant.material,
                      image_url: newVariant.image_url,
                    },
                    product_new: newProduct ? { id: newProduct.id, name: newProduct.name } : null,
                  })
                }
              }

              return enrichedItem
            })
          )

          // Type assertion needed because we're enriching the data structure with additional fields
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.order_items = enrichedItems as any
        }

        console.log('✅ [API/admin/orders/[id]] Order details fetched successfully')
        res.status(200).json(data)
        break
      }

      case 'PUT': {
        console.log('🔍 [API/admin/orders/[id]] Updating order:', id)
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update(req.body)
          .eq('id', id)

        if (updateError) {
          console.error('❌ [API/admin/orders/[id]] Error updating order:', updateError)
          return res.status(500).json({ error: 'Failed to update order' })
        }

        console.log('✅ [API/admin/orders/[id]] Order updated successfully')
        res.status(200).json({ success: true })
        break
      }

      case 'DELETE': {
        console.log('🔍 [API/admin/orders/[id]] Deleting order:', id)
        const { error: deleteError } = await supabaseAdmin.from('orders').delete().eq('id', id)

        if (deleteError) {
          console.error('❌ [API/admin/orders/[id]] Error deleting order:', deleteError)
          return res.status(500).json({ error: 'Failed to delete order' })
        }

        console.log('✅ [API/admin/orders/[id]] Order deleted successfully')
        res.status(200).json({ success: true })
        break
      }

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('❌ [API/admin/orders/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
