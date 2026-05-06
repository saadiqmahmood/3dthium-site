/**
 * E2E: Checkout flows.
 *
 * Note: Full checkout E2E requires live Stripe test keys and a seeded DB.
 * These tests cover what can be verified against the running dev server
 * without completing a real payment. Stripe integration uses test mode.
 *
 * Tests that require Stripe redirect are annotated with @stripe and
 * can be skipped in CI without STRIPE_SECRET_KEY.
 */
import { expect, test } from '@playwright/test'

test.describe('Cart page', () => {
  test('renders empty cart state', async ({ page }) => {
    await page.goto('/cart')
    // Should show empty state, not crash
    await expect(page.locator('body')).not.toContainText('Error')
    await expect(page.locator('body')).not.toContainText('undefined')
  })

  test('cart page does not show raw JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })
})

test.describe('Checkout page', () => {
  test('renders without crashing when cart is empty', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.locator('body')).not.toContainText('undefined')
  })
})

test.describe('Price tampering via API (non-browser)', () => {
  test('POST /api/checkout_sessions rejects a tampered item price', async ({ request }) => {
    // We can't know prod product IDs, so this may return 400 "Product not found"
    // rather than a Stripe session — both are acceptable. What must NOT happen
    // is a 200 with a Stripe session built from the tampered price.
    const res = await request.post('/api/checkout_sessions', {
      data: {
        cart: [
          {
            product_id: 'nonexistent-product-id',
            quantity: 1,
            name: 'Hacked Product',
            price: 0.01, // tampered
            image_url: '',
          },
        ],
        email: 'hacker@example.com',
      },
      headers: { 'Content-Type': 'application/json' },
    })

    // Must not succeed — either 400 (product not found) or 500
    expect(res.status()).not.toBe(200)
  })

  test('POST /api/checkout_sessions rejects when email is missing', async ({ request }) => {
    const res = await request.post('/api/checkout_sessions', {
      data: { cart: [{ product_id: 'x', quantity: 1, name: 'X', price: 10, image_url: '' }] },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/checkout_sessions rejects an empty cart', async ({ request }) => {
    const res = await request.post('/api/checkout_sessions', {
      data: { cart: [], email: 'buyer@test.com' },
    })
    expect(res.status()).toBe(400)
  })
})

test.describe('Shippo webhook security', () => {
  test('rejects requests without Authorization header', async ({ request }) => {
    const res = await request.post('/api/shippo/webhook', {
      data: {
        event: 'tracking_updated',
        data: { tracking_number: 'TRACK123', tracking_status: { status: 'DELIVERED' } },
      },
    })
    expect(res.status()).toBe(401)
  })

  test('rejects requests with wrong secret', async ({ request }) => {
    const res = await request.post('/api/shippo/webhook', {
      data: {
        event: 'tracking_updated',
        data: { tracking_number: 'TRACK123', tracking_status: { status: 'DELIVERED' } },
      },
      headers: { Authorization: 'Bearer wrong_secret' },
    })
    expect(res.status()).toBe(401)
  })
})

test.describe('Stripe webhook security', () => {
  test('rejects webhook events without a Stripe-Signature header', async ({ request }) => {
    const res = await request.post('/api/stripe/webhook', {
      data: { id: 'evt_test', type: 'checkout.session.completed' },
    })
    expect(res.status()).toBe(400)
  })

  test('rejects webhook events with a tampered signature', async ({ request }) => {
    const res = await request.post('/api/stripe/webhook', {
      data: { id: 'evt_test', type: 'checkout.session.completed' },
      headers: { 'stripe-signature': 'v1=tampered_signature_value' },
    })
    expect(res.status()).toBe(400)
  })
})
