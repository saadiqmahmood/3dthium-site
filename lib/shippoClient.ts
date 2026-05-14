// Types for shipping
export interface ShippingAddress {
  name: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
}

export interface ShippingRate {
  object_id: string
  rate: string
  currency: string
  servicelevel: {
    name: string
    token: string
  }
  days: number
  arrives_by?: string
  duration_terms?: string
  provider?: string
}

export interface ShipmentRequest {
  address_from: ShippingAddress
  address_to: ShippingAddress
  parcels: Array<{
    length: string
    width: string
    height: string
    distance_unit: string
    weight: string
    mass_unit: string
  }>
}

export interface ShippoTransaction {
  status: string
  tracking_number?: string
  tracking_url?: string
  label_url?: string
  messages?: unknown
}

const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || ''
const SHIPPO_API_URL = 'https://api.goshippo.com'

// Helper function to create a shipment and get rates using Shippo REST API
export async function getShippingRates(shipmentData: ShipmentRequest): Promise<ShippingRate[]> {
  const response = await fetch(`${SHIPPO_API_URL}/shipments/`, {
    method: 'POST',
    headers: {
      Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...shipmentData, async: false }),
  })
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Shippo API error:', errorText)
    throw new Error('Failed to fetch shipping rates')
  }
  const shipment = await response.json()
  if (shipment.rates && shipment.rates.length > 0) {
    return shipment.rates.map(
      (rate: {
        object_id: string
        amount: string
        currency: string
        servicelevel: { name: string; token: string }
        estimated_days: number
        arrives_by?: string
        duration_terms?: string
        provider?: string
      }) => ({
        object_id: rate.object_id,
        rate: rate.amount,
        currency: rate.currency,
        servicelevel: {
          name: rate.servicelevel.name,
          token: rate.servicelevel.token,
        },
        days: rate.estimated_days,
        arrives_by: rate.arrives_by,
        duration_terms: rate.duration_terms,
        provider: rate.provider,
      })
    )
  }
  return []
}

// Helper function to create a shipping label using Shippo REST API
export async function createShippingLabel(rateId: string): Promise<ShippoTransaction> {
  const response = await fetch(`${SHIPPO_API_URL}/transactions/`, {
    method: 'POST',
    headers: {
      Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rate: rateId,
      label_file_type: 'PDF',
      async: false,
    }),
  })
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Shippo API error:', errorText)
    throw new Error('Failed to create shipping label')
  }
  return response.json()
}
