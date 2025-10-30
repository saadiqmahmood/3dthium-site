import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

/**
 * Order Confirmation Email API
 * 
 * This endpoint sends order confirmation emails to customers.
 * To use this, you'll need to integrate an email service (Resend, SendGrid, etc.)
 * 
 * Example usage:
 * POST /api/admin/send-order-confirmation
 * Body: { orderId: "uuid" }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(
        `id, user_id, guest_email, total_price, status, created_at, shipping_name, shipping_address, shipping_city, shipping_postcode, shipping_country, shipping_phone, shipping_method, shipping_cost, tracking_number, tracking_url, order_items(id, quantity, size, price_at_purchase, variant_id, variant_new, product_new, products(title), product_variants(color, image_url))`
      )
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ [API/admin/send-order-confirmation] Error fetching order:', orderError)
      return res.status(500).json({ error: 'Failed to fetch order' })
    }

    const customerEmail = order.guest_email || order.user_id
    if (!customerEmail) {
      return res.status(400).json({ error: 'No email address found for order' })
    }

    // Format order items for email
    const orderItems = (order.order_items || []).map((item: unknown) => {
      const i = item as Record<string, unknown>
      const variant = i.variant_new || i.product_variants
      return {
        name: i.product_new?.name || i.products?.title || 'Product',
        quantity: i.quantity,
        price: i.price_at_purchase,
        size: variant?.size || i.size || null,
        color: variant?.color || i.product_variants?.color || null,
        material: variant?.material || null,
        total: (i.price_at_purchase as number) * (i.quantity as number),
      }
    })

    // Generate email HTML template
    const emailHtml = generateOrderConfirmationEmail({
      orderId: order.id.slice(-8),
      orderDate: new Date(order.created_at).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      total: order.total_price,
      items: orderItems,
      shippingAddress: order.shipping_address
        ? `${order.shipping_name || ''}\n${order.shipping_address}\n${order.shipping_city || ''} ${order.shipping_postcode || ''}\n${order.shipping_country || 'GB'}`
        : null,
      trackingNumber: order.tracking_number || null,
      trackingUrl: order.tracking_url || null,
    })

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // Example with Resend:
    // const { data, error } = await resend.emails.send({
    //   from: 'orders@3dthium.com',
    //   to: customerEmail,
    //   subject: `Order Confirmation #${order.id.slice(-8)}`,
    //   html: emailHtml,
    // })

    console.log('📧 [API/admin/send-order-confirmation] Email would be sent to:', customerEmail)
    console.log('📧 [API/admin/send-order-confirmation] Email HTML length:', emailHtml.length)

    // For now, return success (implement actual email sending when service is configured)
    return res.status(200).json({
      success: true,
      message: 'Order confirmation email prepared (email service not configured)',
      email: customerEmail,
      orderId: order.id,
    })
  } catch (error) {
    console.error('❌ [API/admin/send-order-confirmation] Error:', error)
    return res.status(500).json({ error: 'Failed to send confirmation email' })
  }
}

function generateOrderConfirmationEmail({
  orderId,
  orderDate,
  total,
  items,
  shippingAddress,
  trackingNumber,
  trackingUrl,
}: {
  orderId: string
  orderDate: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
    size: string | null
    color: string | null
    material: string | null
    total: number
  }>
  shippingAddress: string | null
  trackingNumber: string | null
  trackingUrl: string | null
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${orderId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .order-id {
      font-size: 18px;
      color: #666;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e5e5;
    }
    .item {
      display: flex;
      justify-content: space-between;
      padding: 15px;
      background: #f9fafb;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .item-details {
      flex: 1;
    }
    .item-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .item-attributes {
      font-size: 14px;
      color: #6b7280;
      margin-top: 5px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-right: 6px;
      margin-top: 4px;
    }
    .badge-color { background: #dbeafe; color: #1e40af; }
    .badge-size { background: #f3e8ff; color: #6b21a8; }
    .badge-material { background: #d1fae5; color: #065f46; }
    .item-price {
      text-align: right;
      font-weight: 600;
      color: #1f2937;
    }
    .total {
      display: flex;
      justify-content: space-between;
      padding: 15px;
      background: #eff6ff;
      border-radius: 6px;
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
    }
    .shipping {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-line;
    }
    .tracking {
      background: #ecfdf5;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #10b981;
    }
    .tracking-link {
      color: #059669;
      text-decoration: none;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">3Dthium</div>
      <div class="order-id">Order #${orderId}</div>
      <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">${orderDate}</div>
    </div>

    <div class="section">
      <div class="section-title">Order Items</div>
      ${items
        .map(
          (item) => `
        <div class="item">
          <div class="item-details">
            <div class="item-name">${item.name} × ${item.quantity}</div>
            <div class="item-attributes">
              ${item.size ? `<span class="badge badge-size">Size: ${item.size}</span>` : ''}
              ${item.color ? `<span class="badge badge-color">Color: ${item.color}</span>` : ''}
              ${item.material ? `<span class="badge badge-material">Material: ${item.material}</span>` : ''}
            </div>
          </div>
          <div class="item-price">
            £${item.total.toFixed(2)}
            <div style="font-size: 12px; font-weight: normal; color: #6b7280; margin-top: 2px;">
              £${item.price.toFixed(2)} each
            </div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <div class="section">
      <div class="total">
        <span>Total</span>
        <span>£${total.toFixed(2)}</span>
      </div>
    </div>

    ${shippingAddress ? `
    <div class="section">
      <div class="section-title">Shipping Address</div>
      <div class="shipping">${shippingAddress}</div>
    </div>
    ` : ''}

    ${trackingNumber ? `
    <div class="section">
      <div class="tracking">
        <strong>Tracking Information:</strong><br>
        ${trackingUrl ? `<a href="${trackingUrl}" class="tracking-link">${trackingNumber}</a>` : trackingNumber}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p>Thank you for your order!</p>
      <p>If you have any questions, please contact us at support@3dthium.com</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

