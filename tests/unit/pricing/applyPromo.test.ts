import { describe, expect, it } from 'vitest'
import {
  type PromoCode,
  computeDiscount,
  validatePromo,
} from '@/lib/pricing/applyPromo'

function makePromo(overrides: Partial<PromoCode> = {}): PromoCode {
  return {
    id: 'promo-1',
    code: 'TEST10',
    type: 'percentage',
    value: 10,
    min_order_value: null,
    max_uses: null,
    uses: 0,
    expires_at: null,
    active: true,
    ...overrides,
  }
}

describe('computeDiscount', () => {
  it('applies percentage discount', () => {
    expect(computeDiscount(makePromo({ type: 'percentage', value: 20 }), 100)).toBe(20)
  })

  it('applies fixed discount', () => {
    expect(computeDiscount(makePromo({ type: 'fixed', value: 15 }), 100)).toBe(15)
  })

  it('clamps fixed discount to order total — cannot go negative', () => {
    expect(computeDiscount(makePromo({ type: 'fixed', value: 200 }), 50)).toBe(50)
  })

  it('clamps percentage discount to order total', () => {
    expect(computeDiscount(makePromo({ type: 'percentage', value: 150 }), 100)).toBe(100)
  })

  it('returns 0 for 0% discount', () => {
    expect(computeDiscount(makePromo({ type: 'percentage', value: 0 }), 100)).toBe(0)
  })
})

describe('validatePromo', () => {
  it('returns valid for an active, unexpired code', () => {
    const result = validatePromo(makePromo(), 100)
    expect(result.valid).toBe(true)
  })

  it('rejects an inactive code', () => {
    const result = validatePromo(makePromo({ active: false }), 100)
    expect(result.valid).toBe(false)
    expect((result as { valid: false; message: string }).message).toMatch(/not active/i)
  })

  it('rejects an expired code', () => {
    const result = validatePromo(
      makePromo({ expires_at: new Date(Date.now() - 1000).toISOString() }),
      100
    )
    expect(result.valid).toBe(false)
    expect((result as { valid: false; message: string }).message).toMatch(/expired/i)
  })

  it('rejects when max_uses is reached', () => {
    const result = validatePromo(makePromo({ max_uses: 5, uses: 5 }), 100)
    expect(result.valid).toBe(false)
    expect((result as { valid: false; message: string }).message).toMatch(/usage limit/i)
  })

  it('rejects when order total is below min_order_value', () => {
    const result = validatePromo(makePromo({ min_order_value: 50 }), 40)
    expect(result.valid).toBe(false)
    expect((result as { valid: false; message: string }).message).toMatch(/minimum/i)
  })

  it('accepts when order total meets min_order_value exactly', () => {
    const result = validatePromo(makePromo({ min_order_value: 50 }), 50)
    expect(result.valid).toBe(true)
  })

  it('accepts a not-yet-expired future code', () => {
    const result = validatePromo(
      makePromo({ expires_at: new Date(Date.now() + 86_400_000).toISOString() }),
      100
    )
    expect(result.valid).toBe(true)
  })

  it('accepts when uses < max_uses', () => {
    const result = validatePromo(makePromo({ max_uses: 10, uses: 9 }), 100)
    expect(result.valid).toBe(true)
  })

  it('returns discountAmount in valid result', () => {
    const result = validatePromo(makePromo({ type: 'fixed', value: 5 }), 100)
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.discountAmount).toBe(5)
  })
})
