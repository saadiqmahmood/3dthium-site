import type { NextApiRequest, NextApiResponse } from 'next'
import { log } from '../../../lib/log'
import { createShippingLabel } from '../../../lib/shippoClient'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export interface LabelResult {
  success: true
  tracking_number: string | undefined
  tracking_url: string | undefined
  label_url: string | undefined
}

export async function createLabelForOrder(
  rateId: string,
  orderId: string
): Promise<LabelResult | { success: false; error: string }> {
  const transaction = await createShippingLabel(rateId)
  const supabaseAdmin = getSupabaseAdmin()

  if (transaction.status !== 'SUCCESS') {
    return { success: false, error: 'Shippo transaction failed' }
  }

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      tracking_number: transaction.tracking_number,
      tracking_url: transaction.tracking_url,
      shipping_label_url: transaction.label_url,
      shipped_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    log.error('Error updating order with label:', updateError)
    return { success: false, error: 'Failed to update order with label info' }
  }

  return {
    success: true,
    tracking_number: transaction.tracking_number,
    tracking_url: transaction.tracking_url,
    label_url: transaction.label_url,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { rate_id, order_id } = req.body

    if (!rate_id || !order_id) {
      return res.status(400).json({ error: 'Missing rate_id or order_id' })
    }

    const result = await createLabelForOrder(rate_id, order_id)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.status(200).json(result)
  } catch (error) {
    log.error('Error creating shipping label:', error)
    res.status(500).json({ error: 'Failed to create shipping label' })
  }
}
