# Security Audit Results

**Date**: 2026-04-26  
**Engineer**: Security Engineer (Wave 1)

---

## What Was Found and Fixed

### 1. Leaked Credentials in `env.example` — FIXED

Real values for all seven secrets (Supabase URL + anon key + service role key, Stripe secret + webhook secret + publishable key, Shippo API key) were committed in `env.example`. All replaced with `your_...` placeholders.

**Action required by operator**: Rotate all seven keys. See `SECURITY_ROTATION.md`.

### 2. Unauthenticated Admin API Routes — FIXED

All 19 routes under `pages/api/admin/**` had zero server-side authentication. Any internet user could read all orders, users, and products, or mutate them.

**Fix**: Created `lib/auth/requireAdmin.ts` using `@supabase/ssr` with Pages Router cookie adapter. Calls `supabase.auth.getUser()` (network-verified — not just the cookie) then checks `public.users.is_admin`. Returns 401/403 on failure. Applied to every admin route.

Routes gated (19 total):
- admin/categories, admin/categories/[id]
- admin/category-attributes/[categoryId]
- admin/custom-orders, admin/custom-orders/[id]
- admin/metrics
- admin/order-items/[id]
- admin/orders, admin/orders/[id]
- admin/product-variants/[productId], admin/product-variants/[productId]/[variantId]
- admin/products, admin/products/[id]
- admin/products/[id]/attributes, admin/products/[id]/variations/generate
- admin/send-order-confirmation
- admin/upload-image
- admin/users, admin/users/[id]

### 3. IDOR in `/api/auth/check-admin` — FIXED

`POST /api/auth/check-admin` accepted arbitrary `{ userId }` from any caller and returned that user's admin status. Anyone could enumerate admin status for any user ID.

**Fix**: Deleted `check-admin.ts`. Created `GET /api/auth/me` which uses the caller's own session cookie — no body parameters accepted. Updated `context/AuthContext.tsx` to call the new endpoint.

### 4. Public Debug Endpoints — FIXED

Three endpoints exposed full DB contents to anyone:
- `GET /api/test` — all products + variants
- `GET /api/test-orders` — recent order with full joins
- `GET /api/test-product` — full product with category join

**Fix**: Files deleted.

### 5. Service Role Key Used for Public Reads — FIXED

`pages/api/products.ts`, `pages/api/products/[slug].ts`, `pages/api/products/[slug]/variants.ts`, and `pages/api/promo_code/validate.ts` all used `SUPABASE_SERVICE_ROLE_KEY`, bypassing RLS entirely.

**Fix**: Created `lib/supabase/anon.ts` exporting `getSupabaseAnon()`. All four routes switched to the anon client. Service role usage is now restricted to admin-gated routes and webhook handlers.

### 6. Stripe Webhook Idempotency — FIXED

`checkout.session.completed` would re-create orders on every Stripe retry.

**Fix**: Added `stripe_webhook_events` table insert at the top of the handler. On duplicate `event.id` (Postgres unique constraint violation `23505`), returns 200 immediately without re-processing. Also: webhook now fails closed (returns 500) if `STRIPE_WEBHOOK_SECRET` is undefined — previously would crash with an unhelpful error.

**Note**: The `stripe_webhook_events` table must be created in the DB. SQL:
```sql
CREATE TABLE stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload JSONB,
  received_at TIMESTAMPTZ DEFAULT now()
);
```
The DBA engineer should add this as a Drizzle migration.

### 7. Shippo Webhook — No Verification — FIXED

`pages/api/shippo/webhook.ts` accepted any POST with no authentication. Anyone who knew a tracking number could mark arbitrary orders as delivered.

**Fix**: Added `SHIPPO_WEBHOOK_SECRET` bearer-token check. Requests must include `Authorization: Bearer <SHIPPO_WEBHOOK_SECRET>`. See `SECURITY_ROTATION.md` item 6 for Shippo dashboard configuration steps.

### 8. Storage RLS — FIXED (SQL produced, must be applied)

`database/disable_storage_rls.sql` and `database/nuclear_storage_fix.sql` were still in the repo and would disable RLS on `storage.objects` and grant `ALL` to `anon`/`public`.

**Fix**: Added `DEPRECATED` header to all dangerous SQL files. Created `database/storage_rls.sql` with correct RLS: re-enables RLS, public SELECT on `products` bucket, no anon writes.

**Action required**: Run `database/storage_rls.sql` in Supabase SQL Editor.

### 9. General Data-Table RLS — DOCUMENTED

`database/setup_public_rls_policies.sql` already creates correct SELECT-only policies for anon on public tables (`products_new`, `product_variants_new`, `categories`, `category_attributes`). No anon write policies found.

**Fix**: Created `database/rls_final.sql` as the authoritative RLS policy set. Marked all other RLS files `DEPRECATED`.

**Action required**: Run `database/rls_final.sql` in Supabase SQL Editor to apply user-scoped policies on `orders`, `order_items`, `checkout_carts`, `users`.

### 10. Security Headers — FIXED

`next.config.ts` had no security headers and exposed the `X-Powered-By: Next.js` header.

**Fix**: Added `poweredByHeader: false`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. Also upgraded `images.domains` (deprecated) to `images.remotePatterns`.

CSP is deferred — Stripe.js requires `unsafe-inline` which makes it complex. Left a TODO comment.

---

## Still Open — For Other Roles

### Backend Engineer
- **Price tampering**: `pages/api/checkout_sessions.ts` still trusts `item.price` from the client body. The fix is: look up `products_new.base_price + product_variants_new.price_adjustment` server-side.
- **Shipping cost tampering**: Same file trusts `shipping_cost` from the client. Fix: re-fetch rate from Shippo by `shipping_rate_id`.
- **Promo code `apply=true`** increments `uses` without an order linkage. Fix: move `uses` increment to after successful Stripe payment.
- **Stripe webhook self-HTTP call** to `/api/shipping/label` uses `http://localhost:3000` fallback. Fix: extract `createLabelForOrder()` and call directly.

### Frontend Engineer
- **`SessionDebug` component** — verify it doesn't ship in production (`pages/_app.tsx`).
- **`AdminLayout`** still does client-side redirect-only — should add `getServerSideProps` calling `/api/auth/me`.

### DBA Engineer
- Create `stripe_webhook_events` table (SQL above under item 6).
- Apply `database/rls_final.sql` and `database/storage_rls.sql` to production.
- Archive all deprecated `database/*.sql` files.

### DevOps Engineer
- Git history contains real secrets committed in `env.example`. Run `git filter-repo` before this repo is ever shared or made public.
- Set `SHIPPO_WEBHOOK_SECRET` in Vercel environment variables.

---

## Service Role Usage Audit (After This Pass)

The following routes still legitimately use the service role key:

| Route | Reason |
|-------|--------|
| `pages/api/stripe/webhook.ts` | Webhook must create orders/order_items — needs service role to write |
| `pages/api/shippo/webhook.ts` | Updates order status — webhook route, now verified |
| `pages/api/admin/**` | Admin routes — gated by `requireAdmin` |
| `pages/api/shipping/label.ts` | Creates shipping labels — called from webhook or admin |
| `pages/api/checkout_sessions.ts` | Reads cart + creates checkout_carts — should switch to anon for reads (Backend Engineer) |
| `lib/auth/requireAdmin.ts` | Looks up `is_admin` in `public.users` — appropriate |
