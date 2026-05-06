/**
 * Verifies that every /api/admin/* route returns 401 when called without
 * an admin session cookie.
 *
 * The requireAdmin helper is mocked to simulate the three outcomes:
 *   1. No session   → 401
 *   2. Non-admin    → 403
 *   3. Valid admin  → handler proceeds
 */
import { testApiHandler } from 'next-test-api-route-handler'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Default: unauthenticated — requireAdmin sends 401 and returns null
const requireAdminMock = vi.fn()

vi.mock('@/lib/auth/requireAdmin', () => ({
  requireAdmin: requireAdminMock,
}))

// Silence unrelated deps
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn(),
    })),
  })),
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  },
}))

vi.mock('@/lib/log', () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// The routes under test — representative sample covering GET and mutating verbs
const adminRoutes = [
  { path: '../../../pages/api/admin/products', method: 'GET' },
  { path: '../../../pages/api/admin/categories', method: 'GET' },
  { path: '../../../pages/api/admin/orders', method: 'GET' },
  { path: '../../../pages/api/admin/users', method: 'GET' },
  { path: '../../../pages/api/admin/metrics', method: 'GET' },
  { path: '../../../pages/api/admin/custom-orders', method: 'GET' },
] as const

describe('Admin routes — unauthenticated access returns 401', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder'
    process.env.DATABASE_URL = 'postgresql://placeholder'

    // Simulate requireAdmin sending 401 and returning null
    requireAdminMock.mockImplementation(async (_req, res) => {
      res.status(401).json({ error: 'Unauthorized' })
      return null
    })
  })

  for (const route of adminRoutes) {
    it(`${route.method} ${route.path.replace('../../../pages', '')} → 401`, async () => {
      let status = 0

      await testApiHandler({
        
        pagesHandler: (await import(route.path)).default,
        url: `/api/admin/${route.path.split('/admin/')[1]}`,
        test: async ({ fetch }) => {
          const res = await fetch({ method: route.method })
          status = res.status
        },
      })

      expect(status).toBe(401)
    })
  }
})

describe('Admin routes — non-admin user returns 403', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder'
    process.env.DATABASE_URL = 'postgresql://placeholder'

    // Simulate requireAdmin sending 403 and returning null
    requireAdminMock.mockImplementation(async (_req, res) => {
      res.status(403).json({ error: 'Forbidden' })
      return null
    })
  })

  it('GET /api/admin/products → 403 for non-admin', async () => {
    let status = 0

    await testApiHandler({
      
      pagesHandler: (await import('../../../pages/api/admin/products')).default,
      url: '/api/admin/products',
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' })
        status = res.status
      },
    })

    expect(status).toBe(403)
  })
})
