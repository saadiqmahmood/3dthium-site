import { Resend } from 'resend'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export interface OrderEmailItem {
  name: string
  quantity: number
  price: number
  size: string | null
  color: string | null
  material: string | null
  total: number
}

export interface OrderEmailData {
  orderId: string
  orderDate: string
  total: number
  items: OrderEmailItem[]
  shippingAddress: string | null
  trackingNumber: string | null
  trackingUrl: string | null
}

export function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const { orderId, orderDate, total, items, shippingAddress, trackingNumber, trackingUrl } = data
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${orderId}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f5f5f5}
    .container{background:white;border-radius:8px;padding:30px;box-shadow:0 2px 4px rgba(0,0,0,.1)}
    .header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #e5e5e5}
    .logo{font-size:24px;font-weight:bold;color:#2563eb;margin-bottom:10px}
    .section{margin-bottom:25px}
    .section-title{font-size:16px;font-weight:bold;color:#1f2937;margin-bottom:15px;padding-bottom:8px;border-bottom:1px solid #e5e5e5}
    .item{display:flex;justify-content:space-between;padding:15px;background:#f9fafb;border-radius:6px;margin-bottom:10px}
    .item-name{font-weight:600;color:#1f2937;margin-bottom:5px}
    .item-attrs{font-size:14px;color:#6b7280;margin-top:5px}
    .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;margin-right:6px;margin-top:4px}
    .badge-color{background:#dbeafe;color:#1e40af}
    .badge-size{background:#f3e8ff;color:#6b21a8}
    .badge-material{background:#d1fae5;color:#065f46}
    .item-price{text-align:right;font-weight:600;color:#1f2937}
    .total{display:flex;justify-content:space-between;padding:15px;background:#eff6ff;border-radius:6px;font-size:18px;font-weight:bold;color:#1e40af}
    .shipping{background:#f9fafb;padding:15px;border-radius:6px;font-size:14px;line-height:1.8;white-space:pre-line}
    .tracking{background:#ecfdf5;padding:15px;border-radius:6px;border-left:4px solid #10b981}
    .tracking-link{color:#059669;text-decoration:none;font-weight:600}
    .footer{text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:12px;color:#6b7280}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">3Dthium</div>
      <div style="font-size:18px;color:#666">Order #${orderId}</div>
      <div style="font-size:14px;color:#6b7280;margin-top:5px">${orderDate}</div>
    </div>
    <div class="section">
      <div class="section-title">Order Items</div>
      ${items
        .map(
          (item) => `
      <div class="item">
        <div>
          <div class="item-name">${item.name} × ${item.quantity}</div>
          <div class="item-attrs">
            ${item.size ? `<span class="badge badge-size">Size: ${item.size}</span>` : ''}
            ${item.color ? `<span class="badge badge-color">Color: ${item.color}</span>` : ''}
            ${item.material ? `<span class="badge badge-material">Material: ${item.material}</span>` : ''}
          </div>
        </div>
        <div class="item-price">
          £${item.total.toFixed(2)}
          <div style="font-size:12px;font-weight:normal;color:#6b7280;margin-top:2px">£${item.price.toFixed(2)} each</div>
        </div>
      </div>`
        )
        .join('')}
    </div>
    <div class="section">
      <div class="total"><span>Total</span><span>£${Number(total).toFixed(2)}</span></div>
    </div>
    ${shippingAddress ? `<div class="section"><div class="section-title">Shipping Address</div><div class="shipping">${shippingAddress}</div></div>` : ''}
    ${trackingNumber ? `<div class="section"><div class="tracking"><strong>Tracking:</strong><br>${trackingUrl ? `<a href="${trackingUrl}" class="tracking-link">${trackingNumber}</a>` : trackingNumber}</div></div>` : ''}
    <div class="footer">
      <p>Thank you for your order!</p>
      <p>Questions? Contact us at info@3dthium.co.uk</p>
    </div>
  </div>
</body>
</html>`.trim()
}

export async function sendOrderConfirmation(
  orderId: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  const supabase = getSupabaseAdmin()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, user_id, guest_email, total_price, status, created_at, shipping_name, shipping_address, shipping_city, shipping_postcode, shipping_country, tracking_number, tracking_url, order_items(id, quantity, size, price_at_purchase, variant_id, product_id)'
    )
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    log.error('[email] Error fetching order:', orderError)
    return { success: false, error: 'Order not found' }
  }

  const customerEmail = order.guest_email
  if (!customerEmail && !order.user_id) {
    return { success: false, error: 'No email address for order' }
  }

  const productIds = (order.order_items || [])
    .map((i: { product_id?: string }) => i.product_id)
    .filter(Boolean)
  const { data: products } =
    productIds.length > 0
      ? await supabase.from('products').select('id, name').in('id', productIds)
      : { data: [] }

  const productNameMap = new Map(
    (products ?? []).map((p: { id: string; name: string }) => [p.id, p.name])
  )

  const items: OrderEmailItem[] = (order.order_items || []).map(
    (item: Record<string, unknown>) => ({
      name: productNameMap.get(item.product_id as string) ?? 'Product',
      quantity: item.quantity as number,
      price: Number(item.price_at_purchase),
      size: (item.size as string | null) ?? null,
      color: null,
      material: null,
      total: Number(item.price_at_purchase) * (item.quantity as number),
    })
  )

  const html = buildOrderConfirmationHtml({
    orderId: (order.id as string).slice(-8),
    orderDate: new Date(order.created_at as string).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    total: Number(order.total_price),
    items,
    shippingAddress: order.shipping_address
      ? `${order.shipping_name || ''}\n${order.shipping_address}\n${order.shipping_city || ''} ${order.shipping_postcode || ''}\n${order.shipping_country || 'GB'}`
      : null,
    trackingNumber: (order.tracking_number as string | null) ?? null,
    trackingUrl: (order.tracking_url as string | null) ?? null,
  })

  if (!process.env.RESEND_API_KEY) {
    log.error('[email] RESEND_API_KEY not set — skipping send')
    return { success: false, error: 'Email provider not configured' }
  }

  let toEmail: string | null = customerEmail ?? null
  if (!toEmail && order.user_id) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('email')
      .eq('id', order.user_id)
      .single()
    toEmail = userRecord?.email ?? null
  }

  if (!toEmail) return { success: false, error: 'No email address for order' }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'noreply@3dthium.co.uk',
    to: toEmail,
    subject: `Order Confirmation #${(order.id as string).slice(-8)}`,
    html,
  })
  if (error) {
    log.error('[email] Resend error:', error)
    return { success: false, error: error.message }
  }
  log.info('[email] Order confirmation sent to:', toEmail)
  return { success: true, email: toEmail }
}
