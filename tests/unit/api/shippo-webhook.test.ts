import { testApiHandler } from 'next-test-api-route-handler'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SHIPPO_SECRET = 'shippo_test_webhook_secret'

// ── Mock state ────────────────────────────────────────────────────────────────

const updateCalls: Array<{ table: string; status: string; trackingNumber: string }> = []
// Control whether the DB update finds a row (count > 0)
let mockDbCount = 1

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      // Pre-flight SELECT to check current order status before updating
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockDbCount > 0 ? { id: 'order-1', status: 'pending' } : null,
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn((data: { status: string }) => ({
        eq: vi.fn((field: string, value: string) => {
          if (field === 'tracking_number') {
            updateCalls.push({ table, status: data.status, trackingNumber: value })
          }
          return {
            select: vi.fn().mockImplementation(() =>
              Promise.resolve({
                data: mockDbCount > 0 ? [{ id: 'order-1' }] : [],
                error: null,
                count: mockDbCount,
              })
            ),
          }
        }),
      })),
    })),
  })),
}))

vi.mock('@/lib/log', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ── Helper ────────────────────────────────────────────────────────────────────

function buildShippoEvent(trackingNumber: string, status: string) {
  return {
    event: 'tracking_updated',
    data: {
      tracking_number: trackingNumber,
      tracking_status: { status },
    },
  }
}

async function postShippoWebhook(
  body: object,
  authHeader?: string
): Promise<{ status: number; json: unknown }> {
  let status = 0
  let json: unknown

  await testApiHandler({
    
    pagesHandler: (await import('../../../pages/api/shippo/webhook')).default,
    url: '/api/shippo/webhook',
    test: async ({ fetch }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authHeader !== undefined) headers.authorization = authHeader
      const res = await fetch({ method: 'POST', headers, body: JSON.stringify(body) })
      status = res.status
      json = await res.json()
    },
  })

  return { status, json }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Shippo webhook — auth guard', () => {
  beforeEach(() => {
    updateCalls.length = 0
    mockDbCount = 1
    process.env.SHIPPO_WEBHOOK_SECRET = SHIPPO_SECRET
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder'
  })

  it('returns 401 when no Authorization header is provided', async () => {
    const { status } = await postShippoWebhook(buildShippoEvent('TRACK123', 'DELIVERED'))
    expect(status).toBe(401)
  })

  it('returns 401 for an incorrect secret', async () => {
    const { status } = await postShippoWebhook(
      buildShippoEvent('TRACK123', 'DELIVERED'),
      'Bearer wrong_secret'
    )
    expect(status).toBe(401)
  })

  it('returns 401 when "Bearer " prefix is missing', async () => {
    const { status } = await postShippoWebhook(
      buildShippoEvent('TRACK123', 'DELIVERED'),
      SHIPPO_SECRET // missing "Bearer " prefix
    )
    expect(status).toBe(401)
  })
})

describe('Shippo webhook — happy path', () => {
  beforeEach(() => {
    updateCalls.length = 0
    mockDbCount = 1
    process.env.SHIPPO_WEBHOOK_SECRET = SHIPPO_SECRET
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder'
  })

  it('returns 200 and updates order status for a valid DELIVERED event', async () => {
    const { status } = await postShippoWebhook(
      buildShippoEvent('TRACK123', 'DELIVERED'),
      `Bearer ${SHIPPO_SECRET}`
    )
    expect(status).toBe(200)
    const update = updateCalls.find((u) => u.trackingNumber === 'TRACK123')
    expect(update?.status).toBe('delivered')
  })

  it('maps TRANSIT → "shipped"', async () => {
    await postShippoWebhook(buildShippoEvent('TRACK456', 'TRANSIT'), `Bearer ${SHIPPO_SECRET}`)
    const update = updateCalls.find((u) => u.trackingNumber === 'TRACK456')
    expect(update?.status).toBe('shipped')
  })

  it('maps PRE_TRANSIT → "label_created"', async () => {
    await postShippoWebhook(
      buildShippoEvent('TRACK789', 'PRE_TRANSIT'),
      `Bearer ${SHIPPO_SECRET}`
    )
    const update = updateCalls.find((u) => u.trackingNumber === 'TRACK789')
    expect(update?.status).toBe('label_created')
  })
})

describe('Shippo webhook — error cases', () => {
  beforeEach(() => {
    updateCalls.length = 0
    mockDbCount = 0 // no matching order
    process.env.SHIPPO_WEBHOOK_SECRET = SHIPPO_SECRET
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder'
  })

  it('returns 404 when no order matches the tracking number', async () => {
    const { status } = await postShippoWebhook(
      buildShippoEvent('UNKNOWN_TRACK', 'DELIVERED'),
      `Bearer ${SHIPPO_SECRET}`
    )
    expect(status).toBe(404)
  })

  it('returns 400 when tracking data is missing', async () => {
    mockDbCount = 1
    const { status } = await postShippoWebhook(
      { event: 'tracking_updated', data: {} },
      `Bearer ${SHIPPO_SECRET}`
    )
    expect(status).toBe(400)
  })
})
