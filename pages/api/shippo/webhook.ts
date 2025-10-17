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

  try {
    console.log('Shippo webhook received:', JSON.stringify(req.body, null, 2))
    const event = req.body

    // Extract tracking info - prefer event.data structure (standard Shippo format)
    const trackingNumber = event.data?.tracking_number || event.tracking_number
    const trackingStatus = event.data?.tracking_status?.status || event.tracking_status?.status

    console.log('Extracted tracking info:', { trackingNumber, trackingStatus })

    if (!trackingNumber || !trackingStatus) {
      console.error('Missing tracking data:', { event })
      return res.status(400).json({ error: 'Missing tracking number or status' })
    }
    const mappedStatus = statusMap[trackingStatus] || 'unknown'
    console.log('Mapped status:', { trackingStatus, mappedStatus })

    // Update the order in the database
    const { data, error, count } = await supabase
      .from('orders')
      .update({ status: mappedStatus })
      .eq('tracking_number', trackingNumber)
      .select()

    console.log('Database update result:', { data, error, count })

    if (error) {
      console.error('Error updating order status from Shippo webhook:', error)
      return res.status(500).json({ error: 'Failed to update order status' })
    }

    if (count === 0) {
      console.warn(`No order found with tracking number: ${trackingNumber}`)
      return res.status(404).json({ error: 'Order not found' })
    }

    console.log(`Successfully updated order status to: ${mappedStatus}`)
    res.status(200).json({ success: true, updatedCount: count })
  } catch (err) {
    console.error('Error handling Shippo webhook:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
