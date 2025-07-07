export type Product = {
    id: string
    slug: string
    title: string
    description: string
    category: string
    thumbnail_url: string
}

export type ProductVariant = {
    id: string
    product_id: string
    color: string
    image_url: string
    price: number
    in_stock: boolean
    customizable: boolean
  }

export type ShippingAddress = {
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

export type ShippingRate = {
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

export type Order = {
  id: string
  stripe_session_id: string
  customer_email: string
  total_amount: number
  status: string
  payment_intent_id?: string
  created_at: string
  updated_at: string
  // Shipping fields
  shipping_name?: string
  shipping_address?: string
  shipping_city?: string
  shipping_postcode?: string
  shipping_country?: string
  shipping_phone?: string
  shipping_method?: string
  shipping_rate_id?: string
  shipping_cost?: number
  tracking_number?: string
  tracking_url?: string
  shipped_at?: string
  shipping_label_url?: string
} 