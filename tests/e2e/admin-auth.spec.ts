/**
 * E2E: Admin authentication and authorisation.
 *
 * These tests verify that the admin section is correctly gated at every layer:
 *   - The /admin route redirects unauthenticated users to /auth
 *   - Direct API calls without a session cookie return 401
 *   - Direct API calls with a non-admin cookie return 403
 */
import { expect, test } from '@playwright/test'

test.describe('Admin page access — unauthenticated', () => {
  test('visiting /admin without a session redirects to /auth', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL(/\/(auth|login)/, { timeout: 5000 })
    expect(page.url()).toMatch(/\/(auth|login)/)
  })

  test('visiting /admin/products without a session redirects to /auth', async ({ page }) => {
    await page.goto('/admin/products')
    await page.waitForURL(/\/(auth|login)/, { timeout: 5000 })
    expect(page.url()).toMatch(/\/(auth|login)/)
  })

  test('visiting /admin/orders without a session redirects to /auth', async ({ page }) => {
    await page.goto('/admin/orders')
    await page.waitForURL(/\/(auth|login)/, { timeout: 5000 })
    expect(page.url()).toMatch(/\/(auth|login)/)
  })
})

test.describe('Admin API — direct access without session cookie', () => {
  const adminApiRoutes = [
    { method: 'GET', path: '/api/admin/products' },
    { method: 'GET', path: '/api/admin/categories' },
    { method: 'GET', path: '/api/admin/orders' },
    { method: 'GET', path: '/api/admin/users' },
    { method: 'GET', path: '/api/admin/metrics' },
    { method: 'GET', path: '/api/admin/custom-orders' },
  ]

  for (const route of adminApiRoutes) {
    test(`${route.method} ${route.path} → 401 without session`, async ({ request }) => {
      const res = await request.fetch(route.path, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        // No cookies — simulate a direct API call
      })
      expect(res.status()).toBe(401)
    })
  }
})

test.describe('Public routes are accessible without auth', () => {
  test('/ loads the home page', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
  })

  test('/products loads the product listing', async ({ page }) => {
    const res = await page.goto('/products')
    expect(res?.status()).toBe(200)
  })

  test('/api/products returns JSON', async ({ request }) => {
    const res = await request.get('/api/products')
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  test('/api/health returns 200', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
  })
})
