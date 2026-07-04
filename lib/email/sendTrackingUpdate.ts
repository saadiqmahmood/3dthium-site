import { Resend } from 'resend'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function sendTrackingUpdate(
  orderId: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    log.error('[email/sendTrackingUpdate] RESEND_API_KEY not set')
    return { success: false, error: 'Email provider not configured' }
  }

  const supabase = getSupabaseAdmin()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, guest_email, tracking_number, tracking_url, shipping_method')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    log.error('[email/sendTrackingUpdate] Order not found:', orderError)
    return { success: false, error: 'Order not found' }
  }

  if (!order.tracking_number) {
    log.warn('[email/sendTrackingUpdate] No tracking number on order:', orderId)
    return { success: false, error: 'No tracking number on order' }
  }

  let toEmail: string | null = order.guest_email ?? null
  if (!toEmail && order.user_id) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('email')
      .eq('id', order.user_id)
      .single()
    toEmail = userRecord?.email ?? null
  }

  if (!toEmail) return { success: false, error: 'No email address for order' }

  const orderRef = (order.id as string).slice(-8)
  const trackingNumber = order.tracking_number as string
  const trackingUrl = (order.tracking_url as string | null) ?? null
  const carrier = (order.shipping_method as string | null) ?? null

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your order has shipped</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5">
  <div style="background:white;border-radius:8px;padding:30px;box-shadow:0 2px 4px rgba(0,0,0,.1)">
    <div style="text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #e5e5e5">
      <div style="font-size:22px;font-weight:600;color:#059669">3Dthium</div>
    </div>
    <h2 style="font-size:18px;font-weight:600;color:#1f2937;margin:0 0 12px">Your order is on its way!</h2>
    <p style="margin:0 0 16px;color:#4b5563">Order <strong>#${orderRef}</strong> has been dispatched${carrier ? ` via ${carrier}` : ''}.</p>
    <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:6px;padding:16px;margin:0 0 24px">
      <p style="margin:0 0 6px;font-weight:600;color:#065f46">Tracking number</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#1f2937;letter-spacing:.05em">${trackingNumber}</p>
      ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;margin-top:10px;color:#059669;font-weight:600;text-decoration:none">Track your parcel →</a>` : ''}
    </div>
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:12px;color:#6b7280;text-align:center">
      <p style="margin:0">3Dthium &mdash; Custom 3D Printing</p>
      <p style="margin:4px 0 0">Questions? Contact us at info@3dthium.co.uk</p>
    </div>
  </div>
</body>
</html>`.trim()

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'noreply@3dthium.co.uk',
    to: toEmail,
    subject: `Your order #${orderRef} has shipped`,
    html,
  })

  if (error) {
    log.error('[email/sendTrackingUpdate] Resend error:', error)
    return { success: false, error: error.message }
  }

  log.info('[email/sendTrackingUpdate] Sent to:', toEmail)
  return { success: true, email: toEmail }
}
