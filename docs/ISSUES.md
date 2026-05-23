# Open Issues

## 1. Remove "processing" and "quality check" from order status display

**User-facing (`pages/orders.tsx`):**
Lines 66, 68, 76, 78 — `processing` and `quality_check` are defined as status steps in the progress display array and color map. Remove both entries.

**Admin (`pages/admin/orders.tsx`):**
Line 350 — `processing` appears in a single conditional (badge/filter), not a step display. One reference to clean up.

---

## 2. Recover deleted orders (soft delete)

Currently a hard delete in `pages/api/admin/orders/[id].ts` line 125:
```ts
supabaseAdmin.from('orders').delete().eq('id', id)
```

To support recovery:
- Add `deleted_at` column to the `orders` table in Supabase
- Change DELETE to set `deleted_at = now()` instead of destroying the row
- Filter `deleted_at IS NULL` on all list/fetch queries
- Add a restore endpoint that sets `deleted_at = null`
- Add a "Deleted Orders" view + restore button in the admin UI

---

## 3. Internal server error on delete + generate variants (split-brain bug)

The variant APIs are split across two database clients hitting different tables:

| Endpoint | Client | Table |
|---|---|---|
| `DELETE /api/admin/product-variants/[productId]/[variantId]` | Drizzle | `productVariantsNew` |
| `POST /api/admin/product-variants/[productId]` | Drizzle | `productVariantsNew` |
| `POST /api/admin/products/[id]/variations/generate` | Supabase client | `product_variants` (old) |

After deleting variants via Drizzle, `generate.ts` checks the old Supabase `product_variants` table for duplicates and inserts back into it — causing conflicts or missing-product 500s.

**Fix:** Rewrite `pages/api/admin/products/[id]/variations/generate.ts` to use Drizzle (`db`, `productVariantsNew`) like the other variant endpoints.

---

## 4. Products stopped fetching

`pages/api/products.ts` uses the Supabase anon client with a `categories!category_id(...)` join. This relies on Supabase auto-inferring the foreign key relationship. If the FK was dropped or the table structure changed during a migration, Supabase returns an error and the endpoint 500s.

**Investigate:** Check the live Supabase `products` table schema and confirm the `category_id` FK to `categories` is intact.

---

## 5. Replace printing icon with 3D printer icon

Current: lucide-react `Printer` (office printer) used in `pages/orders.tsx` lines 7 and 67.

Requested: Replace with a custom inline SVG matching `~/Downloads/print.png` — a 3D printer illustration (gantry rail with print head, filament path, and a cube being printed, inside a rectangular frame).
