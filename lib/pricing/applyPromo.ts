export interface PromoCode {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_value: number | null
  max_uses: number | null
  uses: number
  expires_at: string | null
  active: boolean
}

export interface PromoValidation {
  valid: true
  discountAmount: number
  type: PromoCode['type']
  value: number
  code: string
  promoId: string
}

export interface PromoInvalid {
  valid: false
  message: string
}

export function computeDiscount(
  promo: Pick<PromoCode, 'type' | 'value'>,
  orderTotal: number
): number {
  const val = Number(promo.value)
  const raw = promo.type === 'percentage' ? (orderTotal * val) / 100 : val
  return Math.min(Math.max(raw, 0), orderTotal)
}

export function validatePromo(
  promo: PromoCode,
  orderTotal: number
): PromoValidation | PromoInvalid {
  if (!promo.active) return { valid: false, message: 'Promo code is not active' }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { valid: false, message: 'Promo code has expired' }
  }

  if (promo.max_uses !== null && Number(promo.uses) >= Number(promo.max_uses)) {
    return { valid: false, message: 'Promo code usage limit reached' }
  }

  if (promo.min_order_value !== null && orderTotal < Number(promo.min_order_value)) {
    return {
      valid: false,
      message: `Minimum order value for this code is £${promo.min_order_value}`,
    }
  }

  return {
    valid: true,
    discountAmount: computeDiscount(promo, orderTotal),
    type: promo.type,
    value: promo.value,
    code: promo.code,
    promoId: promo.id,
  }
}
