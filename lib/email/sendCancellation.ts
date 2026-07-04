import { Resend } from 'resend'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function sendCancellation(
  orderId: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    log.error('[email/sendCancellation] RESEND_API_KEY not set')
    return { success: false, error: 'Email provider not configured' }
  }

  const supabase = getSupabaseAdmin()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, guest_email, status, total_price')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    log.error('[email/sendCancellation] Order not found:', orderError)
    return { success: false, error: 'Order not found' }
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
  const isRefund = order.status === 'refunded'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your order has been ${isRefund ? 'refunded' : 'cancelled'}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5">
  <div style="background:white;border-radius:8px;padding:30px;box-shadow:0 2px 4px rgba(0,0,0,.1)">
    <div style="text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #e5e5e5">
      <div style="font-size:22px;font-weight:600;color:#059669">3Dthium</div>
    </div>
    <h2 style="font-size:18px;font-weight:600;color:#1f2937;margin:0 0 12px">
      Your order has been ${isRefund ? 'refunded' : 'cancelled'}
    </h2>
    <p style="margin:0 0 16px;color:#4b5563">
      We're letting you know that order <strong>#${orderRef}</strong> has been ${isRefund ? 'refunded' : 'cancelled'}.
      ${isRefund ? `Your refund of <strong>£${Number(order.total_price).toFixed(2)}</strong> will be returned to your original payment method within 5–10 business days.` : ''}
    </p>
    <p style="margin:0 0 16px;color:#4b5563">If you have any questions or didn't expect this, please get in touch and we'll sort it out straight away.</p>
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
    subject: `Your order #${orderRef} has been ${isRefund ? 'refunded' : 'cancelled'}`,
    html,
  })

  if (error) {
    log.error('[email/sendCancellation] Resend error:', error)
    return { success: false, error: error.message }
  }

  log.info('[email/sendCancellation] Sent to:', toEmail)
  return { success: true, email: toEmail }
}
