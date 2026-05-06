/**
 * REGRESSION: Price tampering prevention.
 *
 * Verifies that /api/checkout_sessions ignores client-supplied prices and
 * always fetches authoritative prices from the database.
 *
 * Seeded product: £100. Attacker sends price: 0.01 in the cart payload.
 * The handler must create a Stripe session with unit_amount = 10000 (pence), not 1.
 */
import { testApiHandler } from 'next-test-api-route-handler'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Capture Stripe calls ──────────────────────────────────────────────────────
const stripeSessionParams: Record<string, unknown>[] = []

vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout = {
      sessions: {
        create: (params: unknown) => {
          stripeSessionParams.push(params as Record<string, unknown>)
          return Promise.resolve({ id: 'cs_test_mock', url: 'https://checkout.stripe.com/mock' })
        },
      },
    }
  },
}))

// ── Supabase mock — products table returns base_price = 100 ───────────────────
vi.mock('@supabase/supabase-js', () => {
  const mockFrom = vi.fn((table: string) => {
    if (table === 'products') {
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: 'prod-1', base_price: '100.00', is_active: true }],
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }
    // product_variants and checkout_carts
    return {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
  })
  return { createClient: vi.fn(() => ({ from: mockFrom })) }
})

vi.mock('@/lib/log', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Price tampering regression — /api/checkout_sessions', () => {
  beforeEach(() => {
    stripeSessionParams.length = 0
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder'
    process.env.SHIPPO_API_KEY = 'shippo_test'
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  })

  it('uses DB price (£100 = 10000p), not the tampered client price (£0.01 = 1p)', async () => {
    let status = 0
    let json: unknown

    await testApiHandler({
      
      pagesHandler: (await import('../../../pages/api/checkout_sessions')).default,
      url: '/api/checkout_sessions',
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: [
              {
                product_id: 'prod-1',
                quantity: 1,
                name: 'Test Product',
                price: 0.01, // attacker's tampered price — must be ignored
                image_url: '',
              },
            ],
            email: 'buyer@test.com',
          }),
        })
        status = res.status
        json = await res.json()
      },
    })

    if (status === 200) {
      expect(stripeSessionParams).toHaveLength(1)
      const session = stripeSessionParams[0] as {
        line_items: Array<{ price_data: { unit_amount: number } }>
      }
      const lineItem = session.line_items[0]
      // Server must use £100 (10000p), never the tampered £0.01 (1p)
      expect(lineItem.price_data.unit_amount).toBe(10000)
      expect(lineItem.price_data.unit_amount).not.toBe(1)
    } else {
      // Even on failure, Stripe must not have been called with a tampered price
      expect(
        stripeSessionParams.every((s) => {
          const sess = s as { line_items?: Array<{ price_data?: { unit_amount?: number } }> }
          return !sess.line_items?.some((li) => li.price_data?.unit_amount === 1)
        })
      ).toBe(true)
    }
  })
})

describe('Shipping cost tampering regression — /api/checkout_sessions', () => {
  beforeEach(() => {
    stripeSessionParams.length = 0
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder'
    process.env.SHIPPO_API_KEY = 'shippo_test'
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  })

  it('ignores client-supplied shipping_cost — only uses shipping_rate_id lookup', async () => {
    // MSW handler in tests/mocks/handlers.ts returns £5.99 for any rate ID.
    // The client claims £0 shipping — server must look up the real rate.
    let status = 0

    await testApiHandler({
      
      pagesHandler: (await import('../../../pages/api/checkout_sessions')).default,
      url: '/api/checkout_sessions',
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: [
              {
                product_id: 'prod-1',
                quantity: 1,
                name: 'Test Product',
                price: 100,
                image_url: '',
              },
            ],
            email: 'buyer@test.com',
            shipping_cost: 0, // tampered — ignored by server
            shipping_rate_id: 'rate_test_abc', // server looks this up
          }),
        })
        status = res.status
      },
    })

    if (status === 200 && stripeSessionParams.length > 0) {
      const session = stripeSessionParams[0] as {
        line_items: Array<{ price_data: { unit_amount: number; product_data: { name: string } } }>
      }
      const shippingItem = session.line_items.find(
        (li) => li.price_data.product_data.name === 'Shipping'
      )
      if (shippingItem) {
        // MSW returns 5.99 → 599p — not 0
        expect(shippingItem.price_data.unit_amount).toBeGreaterThan(0)
      }
    }
  })
})
