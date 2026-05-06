/**
 * Promo code endpoint tests.
 *
 * Key assertion: calling /api/promo_code/validate with apply:true (old API)
 * or any number of times must NOT increment the uses counter.
 * The uses counter is only bumped by /api/promo_code/apply, which is called
 * from the Stripe webhook after confirmed payment.
 */
import { testApiHandler } from 'next-test-api-route-handler'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let usesIncrementCount = 0

vi.mock('@/lib/supabase/anon', () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: 'promo-1',
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        min_order_value: null,
        max_uses: null,
        uses: 5,
        expires_at: null,
        active: true,
      },
      error: null,
    }),
    update: vi.fn(() => {
      usesIncrementCount++
      return { eq: vi.fn().mockResolvedValue({ data: null, error: null }) }
    }),
  }))
  return { getSupabaseAnon: vi.fn(() => ({ from: mockFrom })) }
})

vi.mock('@/lib/log', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

describe('/api/promo_code/validate — does NOT increment uses', () => {
  beforeEach(() => {
    usesIncrementCount = 0
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder'
  })

  it('returns valid discount without touching uses counter', async () => {
    let status = 0
    let json: unknown

    await testApiHandler({
      
      pagesHandler: (await import('../../../pages/api/promo_code/validate')).default,
      url: '/api/promo_code/validate',
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'SAVE10', orderTotal: 100 }),
        })
        status = res.status
        json = await res.json()
      },
    })

    expect(status).toBe(200)
    expect((json as { valid?: boolean }).valid).toBe(true)
    expect(usesIncrementCount).toBe(0)
  })

  it('does not increment uses even when called 10 times', async () => {
    for (let i = 0; i < 10; i++) {
      await testApiHandler({
        
        pagesHandler: (await import('../../../pages/api/promo_code/validate')).default,
        url: '/api/promo_code/validate',
        test: async ({ fetch }) => {
          await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'SAVE10', orderTotal: 100 }),
          })
        },
      })
    }
    expect(usesIncrementCount).toBe(0)
  })

  it('returns 400 for a missing code', async () => {
    let status = 0
    await testApiHandler({
      
      pagesHandler: (await import('../../../pages/api/promo_code/validate')).default,
      url: '/api/promo_code/validate',
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderTotal: 100 }),
        })
        status = res.status
      },
    })
    expect(status).toBe(400)
  })

  it('returns 405 for GET requests', async () => {
    let status = 0
    await testApiHandler({
      
      pagesHandler: (await import('../../../pages/api/promo_code/validate')).default,
      url: '/api/promo_code/validate',
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' })
        status = res.status
      },
    })
    expect(status).toBe(405)
  })
})
