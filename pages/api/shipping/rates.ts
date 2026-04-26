import { log } from '../../../lib/log'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getShippingRates, type ShipmentRequest, type ShippingAddress } from '@/lib/shippoClient'

// Helper function to get size multiplier
function getSizeMultiplier(size: string): number {
  switch (size) {
    case '150mm':
      return 1.0
    case '180mm':
      return 1.2
    case '210mm':
      return 1.4
    case '240mm':
      return 1.6
    default:
      return 1.0
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      address_to,
      cart_items,
    }: {
      address_to: ShippingAddress
      cart_items: Array<{
        product: import('@/types').Product
        variant: import('@/types').ProductVariant
        size: string
        quantity: number
      }>
    } = req.body

    if (!address_to || !cart_items || cart_items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const address_from: ShippingAddress = {
      name: '3Dthium',
      street1: '49 Stonecross House',
      city: 'Bolton',
      state: 'Manchester',
      zip: 'BL1 1HU',
      country: 'GB',
      phone: '+447585814347',
      email: 'alsousky@gmail.com',
    }

    // Calculate total weight and dimensions
    let totalWeight = 0
    let maxLength = 0
    let maxWidth = 0
    let maxHeight = 0

    cart_items.forEach((item) => {
      // Estimate weight and dimensions based on size
      const sizeMultiplier = getSizeMultiplier(item.size)
      const itemWeight = 0.5 * sizeMultiplier // Base weight 500g
      const itemLength = 15 * sizeMultiplier // Base length 15cm
      const itemWidth = 10 * sizeMultiplier // Base width 10cm
      const itemHeight = 5 * sizeMultiplier // Base height 5cm

      totalWeight += itemWeight * item.quantity
      maxLength = Math.max(maxLength, itemLength)
      maxWidth = Math.max(maxWidth, itemWidth)
      maxHeight += itemHeight * item.quantity
    })

    // Create shipment request
    const shipmentData: ShipmentRequest = {
      address_from,
      address_to,
      parcels: [
        {
          length: maxLength.toString(),
          width: maxWidth.toString(),
          height: maxHeight.toString(),
          distance_unit: 'cm',
          weight: totalWeight.toString(),
          mass_unit: 'kg',
        },
      ],
    }

    // Get shipping rates
    const rates = await getShippingRates(shipmentData)

    // Return all rates as received from Shippo
    res.status(200).json({ rates })
  } catch (error) {
    log.error('Error calculating shipping rates:', error)
    log.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    res.status(500).json({ error: 'Failed to calculate shipping rates' })
  }
}
