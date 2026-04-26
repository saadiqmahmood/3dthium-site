import { log } from '../../../lib/log'
import type { NextApiRequest, NextApiResponse } from 'next'
import { createShippingLabel } from '../../../lib/shippoClient'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { rate_id, order_id } = req.body

    if (!rate_id || !order_id) {
      return res.status(400).json({ error: 'Missing rate_id or order_id' })
    }

    // Create shipping label
    const transaction = await createShippingLabel(rate_id)
    const supabaseAdmin = getSupabaseAdmin()

    if (transaction.status === 'SUCCESS') {
      // Update order with tracking information
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          tracking_number: transaction.tracking_number,
          tracking_url: transaction.tracking_url,
          shipping_label_url: transaction.label_url,
          shipped_at: new Date().toISOString(),
        })
        .eq('id', order_id)

      if (updateError) {
        log.error('Error updating order:', updateError)
        return res.status(500).json({ error: 'Failed to update order' })
      }

      res.status(200).json({
        success: true,
        tracking_number: transaction.tracking_number,
        tracking_url: transaction.tracking_url,
        label_url: transaction.label_url,
      })
    } else {
      res.status(400).json({
        error: 'Failed to create shipping label',
        details: transaction.messages,
      })
    }
  } catch (error) {
    log.error('Error creating shipping label:', error)
    res.status(500).json({ error: 'Failed to create shipping label' })
  }
}
