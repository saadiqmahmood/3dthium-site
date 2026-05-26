# Backlog

## ~~Priority 1 — Apply migration 0005 (deleted orders recovery)~~ ✅ DONE

`deleted_at` column confirmed live in Supabase. Soft-delete (DELETE) and restore (PATCH) are fully wired in the API and admin UI. Applied manually — not tracked in the Drizzle journal (0004 and 0005 missing from `_journal.json`), which is a housekeeping risk if `drizzle-kit migrate` is run but not urgent.

**Files:** `drizzle/migrations/0005_orders_soft_delete.sql`, `drizzle/migrations/meta/_journal.json`

---

## ~~Priority 2 — Custom order fulfillment~~ ✅ DONE

Rows are now clickable — opens a slide-over modal with full order details, status dropdown (pending/in_progress/completed/cancelled), and admin notes textarea. PATCH endpoint added to the API. Saves update the row in-place without a reload.

**Requires:** Run `drizzle/migrations/0006_custom_orders_admin_notes.sql` in Supabase SQL editor to add the `admin_notes` column.

**Files:** `pages/admin/custom-orders.tsx`, `components/admin/CustomOrderModal.tsx`, `pages/api/admin/custom-orders/[id].ts`

---

## ~~Priority 3 — Order support panel (contact workflow)~~ ✅ DONE

"Contact us about this order" button replaced with a three-state inline panel: collapsed ("Need help?") → form (issue dropdown + optional message textarea) → sent confirmation. Posts to `/api/contact` with the issue type and order ID baked into the subject. No page navigation.

**Files:** `pages/orders.tsx`

---

## ~~Priority 4 — Order stepper center alignment~~ ✅ DONE

Added `mx-auto` to the inner stepper div. The "Order Placed → Printing → Packaging → Shipped → Delivered" chain now centers on all screen widths.

**Files:** `pages/orders.tsx`

---

## ~~Priority 5 — Admin-editable product accordion sections~~ ✅ DONE (pending SQL migration)

Implemented as site-wide settings (client decision). `site_settings` table stores the three accordion values. Admin can edit them at `/admin/site-settings` — changes go live within 60 seconds via ISR. Hardcoded strings remain as fallbacks if DB is empty.

**Requires:** Run `drizzle/migrations/0007_site_settings.sql` in Supabase SQL editor to create the table and seed defaults.

**Files:** `pages/admin/site-settings.tsx`, `pages/api/admin/site-settings.ts`, `pages/api/site-settings.ts`, `pages/products/[slug].tsx`, `components/admin/AdminSidebar.tsx`, `drizzle/migrations/0007_site_settings.sql`
