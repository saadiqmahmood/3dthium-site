# Drizzle Migration Plan

**Goal:** Supabase handles auth and storage only. Drizzle handles all database queries.

This eliminates the `DATABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` split-brain problem.

---

## Current Split

### DRIZZLE — already on Drizzle (5 files)

| File | Tables |
|------|--------|
| `pages/api/admin/products.ts` | `products`, `categories` |
| `pages/api/admin/products/[id].ts` | `products`, `categories` |
| `pages/api/admin/product-variants/[productId].ts` | `product_variants`, `products` |
| `pages/api/admin/product-variants/[productId]/[variantId].ts` | `product_variants` |
| `pages/api/promo_code/apply.ts` | `promo_codes` |

### SUPABASE FOR DB — needs migrating (24 files)

| File | What it queries |
|------|----------------|
| `pages/api/admin/categories.ts` | categories CRUD |
| `pages/api/admin/custom-orders.ts` | custom_orders list |
| `pages/api/admin/generate-variants.ts` | products, variants |
| `pages/api/admin/metrics.ts` | orders, products aggregates |
| `pages/api/admin/order-items/[orderId].ts` | order_items |
| `pages/api/admin/orders.ts` | orders list |
| `pages/api/admin/orders/[id].ts` | orders CRUD |
| `pages/api/admin/product-attributes/[productId].ts` | category_attributes |
| `pages/api/admin/shipping-rates.ts` | shipping_rates |
| `pages/api/admin/users.ts` | users/profiles |
| `pages/api/auth/me.ts` | users/profiles |
| `pages/api/cart/index.ts` | carts, cart_items |
| `pages/api/cart/[itemId].ts` | cart_items |
| `pages/api/categories.ts` | categories (public) |
| `pages/api/checkout/session.ts` | orders, cart |
| `pages/api/custom-order.ts` | custom_orders insert |
| `pages/api/products/[slug].ts` | products, variants |
| `pages/api/products/index.ts` | products list |
| `pages/api/promo_code/validate.ts` | promo_codes |
| `pages/api/quotes/cart.ts` | products, variants |
| `pages/api/stripe/webhook.ts` | orders, order_items |
| `pages/api/orders/[id].ts` | orders |
| `utils/requireAdmin.ts` | profiles check |
| `utils/sendOrderConfirmation.ts` | orders, order_items |

### STAYS SUPABASE FOREVER (auth + storage)

- `supabase.auth.*` — all authentication (login, session, user identity)
- `supabase.storage.*` — `pages/api/upload-image.ts`, custom order file uploads

---

## Phase 0 — Prerequisites

- [ ] Confirm `DATABASE_URL` is correct in Vercel and product-variants admin works in production
- [ ] Audit `drizzle/schema.ts` — add table definitions for anything missing:
  - `orders` / `order_items`
  - `carts` / `cart_items`
  - `custom_orders`
  - `promo_codes`
  - `profiles` / `users`
  - `shipping_rates`
  - `category_attributes`
- [ ] Fix `orderStatusEnum` — remove `'processing'` which was removed from the UI but still in schema

No DB migrations needed — tables already exist, this is just adding Drizzle type definitions.

---

## Phase 1 — Low-risk isolated routes

Read-only or simple inserts. Safe to do quickly.

- [ ] `pages/api/categories.ts`
- [ ] `pages/api/products/index.ts`
- [ ] `pages/api/products/[slug].ts`
- [ ] `pages/api/promo_code/validate.ts` (already Drizzle in `apply.ts`, just inconsistent here)
- [ ] `pages/api/custom-order.ts`

---

## Phase 2 — Admin read routes

Admin-only so failures don't affect customers.

- [ ] `pages/api/admin/categories.ts`
- [ ] `pages/api/admin/metrics.ts`
- [ ] `pages/api/admin/orders.ts`
- [ ] `pages/api/admin/orders/[id].ts`
- [ ] `pages/api/admin/order-items/[orderId].ts`
- [ ] `pages/api/admin/users.ts`
- [ ] `pages/api/admin/custom-orders.ts`
- [ ] `pages/api/admin/shipping-rates.ts`
- [ ] `pages/api/admin/product-attributes/[productId].ts`
- [ ] `pages/api/admin/generate-variants.ts`

---

## Phase 3 — Cart and checkout

Touches money — test thoroughly before deploying.

- [ ] `pages/api/cart/index.ts`
- [ ] `pages/api/cart/[itemId].ts`
- [ ] `pages/api/quotes/cart.ts`
- [ ] `pages/api/checkout/session.ts`
- [ ] `pages/api/orders/[id].ts`

---

## Phase 4 — Critical path

- [ ] `pages/api/stripe/webhook.ts` — test with Stripe CLI in test mode first
- [ ] `utils/requireAdmin.ts` — migrate last; used by all admin routes
- [ ] `utils/sendOrderConfirmation.ts`

Note: `requireAdmin.ts` should still call `supabase.auth.getUser()` for the JWT check — only the profile DB lookup moves to Drizzle.

---

## Phase 5 — Cleanup

- [ ] Remove `SUPABASE_SERVICE_ROLE_KEY` from all non-auth/non-storage files
- [ ] Remove `supabase` client imports from migrated files
- [ ] Keep `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_ANON_KEY` for auth
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` only in `upload-image.ts` and file upload utilities
- [ ] Update Vercel env vars to remove anything no longer needed

---

## Migration pattern

For each file, the swap is:

```ts
// Before (Supabase)
const { data, error } = await supabase
  .from('products')
  .select('id, name, slug')
  .eq('deleted_at', null)

// After (Drizzle)
const data = await db
  .select({ id: products.id, name: products.name, slug: products.slug })
  .from(products)
  .where(isNull(products.deletedAt))
```

Auth checks stay the same — always go through `supabase.auth.getUser()`.
