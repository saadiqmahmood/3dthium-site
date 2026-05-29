import { Resend } from 'resend'
import { log } from '@/lib/log'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendContactReply(opts: {
  to: string
  toName: string
  subject: string | null
  replyBody: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, toName, subject, replyBody } = opts

  if (!process.env.RESEND_API_KEY) {
    log.error('[email/sendContactReply] RESEND_API_KEY is not set')
    return { success: false, error: 'Email provider not configured' }
  }

  const replySubject = subject ? `Re: ${subject}` : 'Re: Your message to 3Dthium'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${replySubject}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5">
  <div style="background:white;border-radius:8px;padding:30px;box-shadow:0 2px 4px rgba(0,0,0,.1)">
    <div style="text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #e5e5e5">
      <div style="font-size:22px;font-weight:600;color:#059669">3Dthium</div>
    </div>
    <p style="margin:0 0 16px">Hi ${toName},</p>
    <div style="white-space:pre-wrap;margin:0 0 24px">${replyBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:12px;color:#6b7280;text-align:center">
      <p style="margin:0">3Dthium &mdash; Custom 3D Printing</p>
      <p style="margin:4px 0 0">Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>`.trim()

  try {
    const { error } = await resend.emails.send({
      from: 'support@3dthium.com',
      to,
      subject: replySubject,
      html,
      replyTo: 'support@3dthium.com',
    })

    if (error) {
      log.error('[email/sendContactReply] Resend error:', error)
      return { success: false, error: error.message }
    }

    log.info('[email/sendContactReply] Reply sent to:', to)
    return { success: true }
  } catch (err) {
    log.error('[email/sendContactReply] Unexpected error:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
