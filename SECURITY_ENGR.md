# Security Engineer — Progress Log

**Branch**: dev  
**Started**: 2026-04-26  
**Stack**: Next.js 15 Pages Router, Supabase, Drizzle ORM, Stripe, Shippo

---

## Checklist

| # | Item | Status | Commit |
|---|------|--------|--------|
| 1 | Rotate/remove leaked credentials in `env.example` + produce `SECURITY_ROTATION.md` | ✅ Done | pending |
| 2 | Create `lib/auth/requireAdmin.ts` + gate all admin routes | ✅ Done | pending |
| 3 | Replace `check-admin.ts` with cookie-based `GET /api/auth/me` | ✅ Done | pending |
| 4 | Delete public debug endpoints (`/api/test*`) | ✅ Done | pending |
| 5 | Stop using service role for public reads (`lib/supabase/anon.ts`) | ✅ Done | pending |
| 6 | Stripe webhook idempotency (`stripe_webhook_events` table check) | ✅ Done | pending |
| 7 | Shippo webhook signature verification (shared-secret bearer token) | ✅ Done | pending |
| 8 | Storage RLS — replace nuclear files with `database/storage_rls.sql` | ✅ Done | pending |
| 9 | General data-table RLS audit + `database/rls_final.sql` | ✅ Done | pending |
| 10 | Security headers in `next.config.ts` | ✅ Done | pending |

---

## Item 1 — Credential Leak (env.example)

**Found**: `env.example` contained REAL values for all secrets:
- `NEXT_PUBLIC_SUPABASE_URL` (real project URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (real JWT)
- `SUPABASE_SERVICE_ROLE_KEY` (real service-role JWT — bypasses ALL RLS)
- `STRIPE_SECRET_KEY` (real test secret `sk_test_...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (real test pub key `pk_test_...`)
- `STRIPE_WEBHOOK_SECRET` (real webhook secret `whsec_...`)
- `SHIPPO_API_KEY` (real test key `shippo_test_...`)

**Action**: Replaced all values with `your_...` placeholders. Added comments.  
**Also**: `.env.local` is in `.gitignore` (confirmed — not tracked).  
**SECURITY_ROTATION.md** produced with all dashboard steps.

---

## Item 2 — Unauthenticated Admin Routes

**Found**: All 19 routes under `pages/api/admin/**` had zero server-side auth.  
**Action**: Created `lib/auth/requireAdmin.ts` using `@supabase/ssr` `createServerClient`  
with Pages Router cookie adapter. It calls `supabase.auth.getUser()` (not getSession),  
then checks `public.users.is_admin`. Returns 401/403 and null on failure.  
Applied to every admin route as the first operation.

Routes gated:
- admin/categories.ts, admin/categories/[id].ts
- admin/category-attributes/[categoryId].ts
- admin/custom-orders.ts, admin/custom-orders/[id].ts
- admin/metrics.ts
- admin/order-items/[id].ts
- admin/orders.ts, admin/orders/[id].ts
- admin/product-variants/[productId].ts, admin/product-variants/[productId]/[variantId].ts
- admin/products.ts, admin/products/[id].ts
- admin/products/[id]/attributes.ts, admin/products/[id]/variations/generate.ts
- admin/send-order-confirmation.ts
- admin/upload-image.ts
- admin/users.ts, admin/users/[id].ts

---

## Item 3 — IDOR in check-admin

**Found**: `POST /api/auth/check-admin` accepted arbitrary `userId` from request body —  
anyone could enumerate admin status for any user ID.  
**Action**: Replaced with `GET /api/auth/me` (cookie-based session, no body params).  
Updated `AuthContext.tsx` to call new endpoint.

---

## Item 4 — Debug Endpoints

**Deleted**: `pages/api/test.ts`, `pages/api/test-orders.ts`, `pages/api/test-product.ts`

---

## Item 5 — Service Role for Public Reads

**Found**: `pages/api/products.ts`, `pages/api/products/[slug].ts`,  
`pages/api/products/[slug]/variants.ts`, `pages/api/promo_code/validate.ts`  
all used `SUPABASE_SERVICE_ROLE_KEY` — bypassing RLS entirely.  
**Action**: Created `lib/supabase/anon.ts` with `getSupabaseAnon()`.  
Switched all four routes to use anon client.

---

## Item 6 — Stripe Webhook Idempotency

**Found**: Webhook handler would re-create orders on every Stripe retry of  
`checkout.session.completed`.  
**Action**: Added `stripe_webhook_events` table check at the top of handler.  
If `event.id` already in table → return 200 immediately.  
Also confirmed `STRIPE_WEBHOOK_SECRET` fails closed if undefined.

---

## Item 7 — Shippo Webhook Unsigned

**Found**: `pages/api/shippo/webhook.ts` accepted any POST with no auth.  
**Action**: Added `SHIPPO_WEBHOOK_SECRET` bearer-token check.  
Request must include `Authorization: Bearer <SHIPPO_WEBHOOK_SECRET>`.  
Dashboard config documented in `SECURITY_ROTATION.md`.

---

## Item 8 — Storage RLS

**Found**: `database/disable_storage_rls.sql` and `database/nuclear_storage_fix.sql`  
grant `ALL` to `anon`/`public` and disable RLS on `storage.objects`.  
**Action**: Created `database/storage_rls.sql` — re-enables RLS, restricts writes  
to `service_role` only, allows public SELECT on `products` bucket.  
Added DEPRECATED header to old files.

---

## Item 9 — General RLS

**Found**: `database/setup_public_rls_policies.sql` already creates correct SELECT-only  
policies for anon on public tables. Confirmed no anon write policies.  
**Action**: Created `database/rls_final.sql` documenting canonical policy set.  
Marked all other RLS files as DEPRECATED.

---

## Item 10 — Security Headers

**Action**: Updated `next.config.ts` with:
- `poweredByHeader: false`
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `images.remotePatterns` replacing deprecated `images.domains`
- TODO comment for CSP (deferred — would fight Stripe/Supabase)

---

## Still Open (for other roles)

- **Price tampering** (`checkout_sessions.ts` trusts `item.price` from client) → Backend Engineer
- **Shipping cost tampering** (same file trusts `shipping_cost` from client) → Backend Engineer
- **Promo code `apply=true` on validate** increments uses without order linkage → Backend Engineer
- **Stripe webhook self-HTTP call** to `/api/shipping/label` → Backend Engineer
- **Contact form is fake** → Backend Engineer + Frontend Engineer
- **Schema split** (`products`/`products_new`) → DBA Engineer
- **Drizzle adoption** in admin routes → Backend Engineer
- **SessionDebug** component in prod → Frontend Engineer
