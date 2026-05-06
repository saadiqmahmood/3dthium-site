# Testing

## Quick start

```bash
# All unit tests (no DB, no running server)
npm run test:unit

# Watch mode
npm run test:watch

# Vitest UI (browser)
npm run test:ui

# E2E tests (requires dev server)
npm run test:e2e

# E2E with Playwright UI
npm run test:e2e:ui
```

## Test layout

```
tests/
  unit/
    pricing/
      applyPromo.test.ts       — validatePromo / computeDiscount edge cases
    api/
      admin-auth.test.ts       — all /api/admin/* routes block unauthenticated + non-admin requests
      checkout-price-tamper.test.ts  — regression: server ignores client-supplied prices
      promo-code.test.ts       — /api/promo_code/validate never increments uses
      shippo-webhook.test.ts   — auth guard, status mapping, 404 on unknown tracking
      stripe-webhook.test.ts   — method guard, missing secret, bad sig, idempotency
  e2e/
    admin-auth.spec.ts         — page redirects + API 401 without session
    checkout.spec.ts           — empty cart/checkout, tamper attempts, webhook security
  fixtures/
    seed.ts                    — seedTestDb() / clearTestDb() helpers for E2E
  mocks/
    handlers.ts                — MSW handlers (Shippo rate lookup, Stripe session)
    server.ts                  — MSW node server instance
  setup.ts                     — global beforeAll/afterEach/afterAll MSW lifecycle
```

## Unit tests (Vitest)

Unit tests run in `node` environment (no DOM). They mock every external dependency — Supabase, Stripe, Shippo — using `vi.mock`. No database or network required.

### Adding a test

1. Create `tests/unit/<area>/<name>.test.ts`.
2. Mock external modules with `vi.mock(...)` at the top level (hoisted by Vitest).
3. For API route tests, use `next-test-api-route-handler`:

```ts
import { testApiHandler } from 'next-test-api-route-handler'

await testApiHandler({
  // @ts-expect-error ntarh pagesHandler typing
  pagesHandler: (await import('../../../pages/api/your-route')).default,
  url: '/api/your-route',
  test: async ({ fetch }) => {
    const res = await fetch({ method: 'POST', body: JSON.stringify({...}) })
    expect(res.status).toBe(200)
  },
})
```

4. Add `// @vitest-environment happy-dom` at the top if you need DOM APIs (component tests).

### Key mocking patterns

**Stripe (as class constructor)**:
```ts
vi.mock('stripe', () => ({
  default: class MockStripe {
    checkout = { sessions: { create: vi.fn().mockResolvedValue({ id: 'cs_test' }) } }
    webhooks = { constructEvent: vi.fn().mockReturnValue(event) }
  },
}))
```

**Supabase**:
```ts
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table) => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))
```

**micro/buffer** (for raw-body routes like the Stripe webhook):
```ts
vi.mock('micro', () => ({
  buffer: vi.fn().mockResolvedValue(Buffer.from('{}'))
}))
```

## E2E tests (Playwright)

E2E tests run against the local dev server (`npm run dev`). Playwright starts it automatically via `webServer` in `playwright.config.ts`.

### Prerequisites

1. A running local dev server (or `webServer` in config handles it).
2. `.env.local` with test credentials (Supabase test project, Stripe test keys, etc.).

### Running with a seeded database

For full checkout flows, seed the DB first:

```ts
// In your test file
import { seedTestDb, clearTestDb } from '../fixtures/seed'

test.beforeAll(() => seedTestDb())
test.afterAll(() => clearTestDb())
```

`seed.ts` uses `TEST_DATABASE_URL` if set, otherwise falls back to `DATABASE_URL`.

### Adding an E2E test

1. Create `tests/e2e/<name>.spec.ts`.
2. Use `page.goto('/route')` or `request.get('/api/...')` for API assertions.
3. For authenticated flows, use Playwright's `storageState` to persist a session.

## Naming conventions

| Pattern | Meaning |
|---------|---------|
| `*.test.ts` | Vitest unit test |
| `*.spec.ts` | Playwright E2E test |
| `describe('Feature — scenario')` | Top-level group |
| `it('does X when Y')` | Individual assertion |

## CI

Unit tests run in the `unit-tests` job in `.github/workflows/ci.yml`, after the lint/typecheck/build job passes. E2E tests are not yet in CI (requires a live test database); run them locally before each release.
