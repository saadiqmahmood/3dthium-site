export type Product = {
  id: string
  slug: string
  title?: string // Legacy schema
  name?: string // New schema
  description: string
  category?: string // Legacy schema
  category_id?: string // New schema
  thumbnail_url: string
  base_price?: number // New schema
  images?: string[] // New schema
  gallery_images?: string[] // New schema
  is_active?: boolean // New schema
  customizable?: boolean // New schema
  attributes?: Record<string, unknown> // New schema
}

// Legacy variant type (for old products table)
export type ProductVariant = {
  id: string
  product_id: string
  color: string
  image_url: string
  price: number
  in_stock: boolean
  customizable: boolean
}

// New variant type for products_new table
export type ProductVariantNew = {
  id: string
  product_id: string

  // Variant attributes (at least one required)
  size?: string // "150mm", "180mm", "210mm", "240mm"
  color?: string // "White", "Black", "Red", "Blue"
  material?: string // "PLA", "PETG", "Resin"

  // Pricing (final price = base_price + price_adjustment)
  price_adjustment: number

  // Optional fields
  sku?: string
  image_url?: string
  stock_quantity: number // 0 = print-on-demand
  is_available: boolean

  // Timestamps
  created_at: string
  updated_at: string
}

// Variant option for UI selection
export type VariantOption = {
  attribute: 'size' | 'color' | 'material'
  value: string
  priceAdjustment: number
  available: boolean
}

// Matrix cell for bulk variant creation
export type VariantMatrixCell = {
  size?: string
  color?: string
  material?: string
  variantId?: string
  price?: number
  exists: boolean
  is_available?: boolean
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
