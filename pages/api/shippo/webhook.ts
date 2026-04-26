import { log } from '../../../lib/log'
import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map Shippo tracking statuses to order statuses
const statusMap: Record<string, string> = {
  PRE_TRANSIT: 'label_created',
  TRANSIT: 'shipped',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
  FAILURE: 'delivery_failed',
  UNKNOWN: 'unknown',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify shared-secret bearer token.
  // Configure the same value in Shippo Dashboard → Webhooks → Custom Headers:
  //   Header name: Authorization  Value: Bearer <SHIPPO_WEBHOOK_SECRET>
  const webhookSecret = process.env.SHIPPO_WEBHOOK_SECRET
  if (!webhookSecret) {
    log.error('SHIPPO_WEBHOOK_SECRET is not set')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  const authHeader = req.headers['authorization']
  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    log.warn('Shippo webhook: invalid or missing Authorization header')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    log.debug('Shippo webhook received:', JSON.stringify(req.body, null, 2))
    const event = req.body

    // Extract tracking info - prefer event.data structure (standard Shippo format)
    const trackingNumber = event.data?.tracking_number || event.tracking_number
    const trackingStatus = event.data?.tracking_status?.status || event.tracking_status?.status

    log.debug('Extracted tracking info:', { trackingNumber, trackingStatus })

    if (!trackingNumber || !trackingStatus) {
      log.error('Missing tracking data:', { event })
      return res.status(400).json({ error: 'Missing tracking number or status' })
    }
    const mappedStatus = statusMap[trackingStatus] || 'unknown'
    log.debug('Mapped status:', { trackingStatus, mappedStatus })

    // Update the order in the database
    const { data, error, count } = await supabase
      .from('orders')
      .update({ status: mappedStatus })
      .eq('tracking_number', trackingNumber)
      .select()

    log.debug('Database update result:', { data, error, count })

    if (error) {
      log.error('Error updating order status from Shippo webhook:', error)
      return res.status(500).json({ error: 'Failed to update order status' })
    }

    if (count === 0) {
      log.warn(`No order found with tracking number: ${trackingNumber}`)
      return res.status(404).json({ error: 'Order not found' })
    }

    log.debug(`Successfully updated order status to: ${mappedStatus}`)
    res.status(200).json({ success: true, updatedCount: count })
  } catch (err) {
    log.error('Error handling Shippo webhook:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
