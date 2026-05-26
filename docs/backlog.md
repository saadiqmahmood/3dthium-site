# Backlog

## Priority 1 — Admin view for contact/support messages

The support panel on the orders page submits to `contact_messages` in Supabase, but there is no admin UI to read them. Support requests are invisible to the admin.

**Needs:** API route `GET /api/admin/contact-messages` + admin page `/admin/messages`.

---

## Priority 2 — Remove console.log from production code

`console.log` statements scattered across `pages/account.tsx`, `pages/auth/index.tsx`, `pages/success.tsx`, and all admin pages. Leaks internal state in the browser console in production.

**Files:** `pages/account.tsx`, `pages/auth/index.tsx`, `pages/success.tsx`, `pages/admin/index.tsx`, `pages/admin/users.tsx`

---

## Priority 3 — Drizzle journal out of sync

Migrations 0004–0007 are not tracked in `drizzle/migrations/meta/_journal.json`. Running `npm run db:migrate` will error on already-applied columns.

**Files:** `drizzle/migrations/meta/_journal.json`

---

## Priority 4 — Replace window.location.reload() with state resets

Two places use hard page reloads for error recovery instead of re-fetching state: admin dashboard retry button (`pages/admin/index.tsx:121`) and custom orders error state (`pages/admin/custom-orders.tsx`).

**Files:** `pages/admin/index.tsx`, `pages/admin/custom-orders.tsx`

---

## Priority 5 — Products listing page has no ISR

`/products` fetches client-side on every load via `ProductGrid`. No static generation or revalidation at the page level. Fine now but worth addressing before launch.

**Files:** `pages/products/index.tsx`

---

## Deferred — API keys (manual)

Stripe and Shippo are on test keys in `.env.local`. Switch to live keys manually before launch.
- Stripe: replace `sk_test_` / `pk_test_` keys
- Shippo: uncomment `shippo_live_` key
