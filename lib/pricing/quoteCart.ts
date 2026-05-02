import { getSupabaseAdmin } from '@/lib/supabaseClient'
import type { PromoCode } from './applyPromo'
import { computeDiscount, validatePromo } from './applyPromo'

export interface CartItemInput {
  product_id: string
  variant_id?: string | null
  quantity: number
  name: string
  image_url?: string
}

export interface QuotedItem {
  product_id: string
  variant_id: string | null
  quantity: number
  name: string
  image_url: string
  unit_price: number
  line_total: number
}

export interface CartQuote {
  items: QuotedItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  promo_code?: string
  promo_id?: string
}

interface QuoteCartOptions {
  shippingRateId?: string
  promoCode?: string
}

const SHIPPO_API_URL = 'https://api.goshippo.com'

export async function quoteCart(
  cart: CartItemInput[],
  opts: QuoteCartOptions = {}
): Promise<CartQuote> {
  const supabase = getSupabaseAdmin()

  const productIds = [...new Set(cart.map((i) => i.product_id))]
  const variantIds = cart.map((i) => i.variant_id).filter(Boolean) as string[]

  const [productsRes, variantsRes] = await Promise.all([
    supabase.from('products').select('id, base_price, is_active').in('id', productIds),
    variantIds.length > 0
      ? supabase
          .from('product_variants')
          .select('id, price_adjustment, is_available')
          .in('id', variantIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; price_adjustment: string; is_available: boolean }>,
        }),
  ])

  const productMap = new Map((productsRes.data ?? []).map((p) => [p.id, p]))
  const variantMap = new Map((variantsRes.data ?? []).map((v) => [v.id, v]))

  const items: QuotedItem[] = []

  for (const item of cart) {
    const product = productMap.get(item.product_id)
    if (!product) throw new Error(`Product not found: ${item.product_id}`)

    let unitPrice = Number(product.base_price)

    if (item.variant_id) {
      const variant = variantMap.get(item.variant_id)
      if (variant) unitPrice += Number(variant.price_adjustment)
    }

    items.push({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
      name: item.name,
      image_url: item.image_url ?? '',
      unit_price: unitPrice,
      line_total: unitPrice * item.quantity,
    })
  }

  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)

  let shipping = 0
  if (opts.shippingRateId) {
    const shippoRes = await fetch(`${SHIPPO_API_URL}/rates/${opts.shippingRateId}`, {
      headers: { Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}` },
    })
    if (shippoRes.ok) {
      const rate = await shippoRes.json()
      shipping = Number(rate.amount)
    }
  }

  let discount = 0
  let promoId: string | undefined
  let resolvedPromoCode: string | undefined

  if (opts.promoCode) {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', opts.promoCode.trim().toUpperCase())
      .single()

    if (promo) {
      const validation = validatePromo(promo as PromoCode, subtotal + shipping)
      if (validation.valid) {
        discount = computeDiscount(promo as PromoCode, subtotal + shipping)
        promoId = promo.id
        resolvedPromoCode = promo.code
      }
    }
  }

  const total = Math.max(subtotal + shipping - discount, 0)

  return {
    items,
    subtotal,
    shipping,
    discount,
    total,
    ...(resolvedPromoCode ? { promo_code: resolvedPromoCode, promo_id: promoId } : {}),
  }
}
