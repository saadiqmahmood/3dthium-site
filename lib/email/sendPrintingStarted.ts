import { Resend } from 'resend'
import { log } from '@/lib/log'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function sendPrintingStarted(
  orderId: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    log.error('[email/sendPrintingStarted] RESEND_API_KEY not set')
    return { success: false, error: 'Email provider not configured' }
  }

  const supabase = getSupabaseAdmin()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, guest_email')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    log.error('[email/sendPrintingStarted] Order not found:', orderError)
    return { success: false, error: 'Order not found' }
  }

  let toEmail: string | null = order.guest_email ?? null
  if (!toEmail && order.user_id) {
    const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id as string)
    toEmail = authUser?.user?.email ?? null
  }

  if (!toEmail) return { success: false, error: 'No email address for order' }

  const orderRef = (order.id as string).slice(-8)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your order is being printed</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5">
  <div style="background:white;border-radius:8px;padding:30px;box-shadow:0 2px 4px rgba(0,0,0,.1)">
    <div style="text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #e5e5e5">
      <div style="font-size:22px;font-weight:600;color:#059669">3Dthium</div>
    </div>
    <h2 style="font-size:18px;font-weight:600;color:#1f2937;margin:0 0 12px">Your order is being printed!</h2>
    <p style="margin:0 0 16px;color:#4b5563">Great news — order <strong>#${orderRef}</strong> has moved into production. Our printers are working on it now.</p>
    <div style="background:#ecfdf5;border-left:4px solid #10b981;border-radius:6px;padding:16px;margin:0 0 24px">
      <p style="margin:0;color:#065f46;font-weight:600">What happens next?</p>
      <p style="margin:8px 0 0;color:#065f46">Once printing is complete we'll package your order and dispatch it. You'll receive another email with your tracking details.</p>
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
    subject: `Your order #${orderRef} is now being printed`,
    html,
  })

  if (error) {
    log.error('[email/sendPrintingStarted] Resend error:', error)
    return { success: false, error: error.message }
  }

  log.info('[email/sendPrintingStarted] Sent to:', toEmail)
  return { success: true, email: toEmail }
}
