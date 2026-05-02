import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { sendOrderConfirmation } from '@/lib/email/sendOrderConfirmation'
import { log } from '../../../lib/log'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { orderId } = req.body as { orderId?: string }

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' })
  }

  try {
    const result = await sendOrderConfirmation(orderId)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    return res.status(200).json({
      success: true,
      message: 'Order confirmation email prepared (email service not configured)',
      email: result.email,
      orderId,
    })
  } catch (error) {
    log.error('[API/admin/send-order-confirmation] Error:', error)
    return res.status(500).json({ error: 'Failed to send confirmation email' })
  }
}
