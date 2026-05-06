/**
 * Stripe webhook handler unit tests.
 *
 * Strategy: mock `micro` (raw body reader) + `stripe.webhooks.constructEvent`
 * so tests don't depend on real signature math or stream buffering.
 * The idempotency, method-guard, and secret-guard logic is what we're testing.
 */
import { testApiHandler } from 'next-test-api-route-handler'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock state ────────────────────────────────────────────────────────────────

let constructEventShouldThrow = false
let constructEventResult: unknown = null
const supabaseInsertResults: Array<{ table: string; data: unknown; error: unknown }> = []
// IDs already persisted (simulate duplicate)
const seenEventIds = new Set<string>()

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock micro/buffer so the route doesn't hang reading the request stream.
vi.mock('micro', () => ({
  buffer: vi.fn().mockResolvedValue(Buffer.from('{}') as Buffer),
}))

// Mock Stripe as a proper class.
vi.mock('stripe', () => ({
  default: class MockStripe {
    apiVersion = '2025-05-28.basil'
    webhooks = {
      constructEvent: vi.fn().mockImplementation(() => {
        if (constructEventShouldThrow) {
          throw new Error('No signatures found matching the expected signature for payload')
        }
        return constructEventResult
      }),
    }
    checkout = { sessions: { create: vi.fn() } }
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      insert: vi.fn((data: unknown) => {
        const id = (data as { id?: string }).id ?? ''
        if (table === 'stripe_webhook_events' && seenEventIds.has(id)) {
          return Promise.resolve({ data: null, error: { code: '23505' } })
        }
        if (table === 'stripe_webhook_events') {
          seenEventIds.add(id)
        }
        supabaseInsertResults.push({ table, data, error: null })
        return Promise.resolve({ data: null, error: null })
      }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    })),
  })),
}))

vi.mock('@/lib/log', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../pages/api/shipping/label', () => ({
  createLabelForOrder: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('../../../pages/api/promo_code/apply', () => ({
  applyPromoCode: vi.fn().mockResolvedValue(true),
}))

// ── Helper ────────────────────────────────────────────────────────────────────

async function callWebhook(opts: {
  method?: string
  sig?: string
}): Promise<{ status: number; json: unknown }> {
  let status = 0
  let json: unknown
  const { method = 'POST', sig = 'v1=fake_sig' } = opts

  await testApiHandler({
    
    pagesHandler: (await import('../../../pages/api/stripe/webhook')).default,
    url: '/api/stripe/webhook',
    test: async ({ fetch }) => {
      const res = await fetch({
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(sig ? { 'stripe-signature': sig } : {}),
        },
        body: method === 'POST' ? '{}' : undefined,
      })
      status = res.status
      json = await res.json().catch(() => null)
    },
  })

  return { status, json }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Stripe webhook — request validation', () => {
  beforeEach(() => {
    constructEventShouldThrow = false
    constructEventResult = null
    supabaseInsertResults.length = 0
    seenEventIds.clear()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder'
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder'
  })

  it('returns 405 for non-POST methods', async () => {
    const { status } = await callWebhook({ method: 'GET' })
    expect(status).toBe(405)
  })

  it('returns 500 when STRIPE_WEBHOOK_SECRET is not set', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const { status } = await callWebhook({})
    expect(status).toBe(500)
  })

  it('returns 400 when stripe.webhooks.constructEvent throws (bad signature)', async () => {
    constructEventShouldThrow = true
    const { status } = await callWebhook({ sig: 'v1=bad_signature' })
    expect(status).toBe(400)
  })
})

describe('Stripe webhook — idempotency', () => {
  beforeEach(() => {
    constructEventShouldThrow = false
    supabaseInsertResults.length = 0
    seenEventIds.clear()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder'
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder'
  })

  it('returns 200 { received: true } for a new event', async () => {
    constructEventResult = {
      id: 'evt_new',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test' } },
    }
    const { status, json } = await callWebhook({})
    expect(status).toBe(200)
    expect((json as { received?: boolean }).received).toBe(true)
  })

  it('returns 200 { duplicate: true } without re-processing a seen event', async () => {
    const eventId = 'evt_already_processed'
    seenEventIds.add(eventId) // pre-seed as already seen

    constructEventResult = {
      id: eventId,
      type: 'payment_intent.succeeded',
      data: { object: {} },
    }

    const { status, json } = await callWebhook({})
    expect(status).toBe(200)
    expect((json as { duplicate?: boolean }).duplicate).toBe(true)

    // No order inserts for the duplicate
    const orderInserts = supabaseInsertResults.filter((r) => r.table === 'orders')
    expect(orderInserts).toHaveLength(0)
  })

  it('does not create a second order when the same event is replayed', async () => {
    const eventId = 'evt_idempotency_replay'

    // First call — succeeds
    constructEventResult = {
      id: eventId,
      type: 'payment_intent.succeeded',
      data: { object: {} },
    }
    await callWebhook({})

    // Second call — same event ID
    const orderInsertsBefore = supabaseInsertResults.filter((r) => r.table === 'orders').length

    const { json } = await callWebhook({})
    expect((json as { duplicate?: boolean }).duplicate).toBe(true)

    const orderInsertsAfter = supabaseInsertResults.filter((r) => r.table === 'orders').length
    expect(orderInsertsAfter).toBe(orderInsertsBefore)
  })
})
