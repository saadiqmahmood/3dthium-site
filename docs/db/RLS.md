# Row-Level Security Policy Reference

_Authoritative RLS intent for all public-facing tables._
_The policies below are applied via `database/_archive/rls_final.sql` (security engineer) and will be converted to Drizzle migrations in a follow-up wave. Storage policies are covered in the storage section._

## Data tables

| Table | anon can SELECT | authenticated can SELECT | Writes |
|---|---|---|---|
| `products_new` (`products` after rename) | Only `is_active = true` rows | Same | service_role only (admin API) |
| `product_variants_new` (`product_variants` after rename) | Only `is_available = true` rows | Same | service_role only |
| `categories` | Only `is_active = true` rows | Same | service_role only |
| `category_attributes` | All rows | Same | service_role only |
| `promo_codes` | Only `active = true` rows | Same | service_role only |
| `orders` | None | Own orders only (`user_id` match via `users.auth_user_id`) | service_role only |
| `order_items` | None | Own order items only (via orders join) | service_role only |
| `checkout_carts` | None | Own carts only | Own carts only |
| `users` | None | Own row only (`auth_user_id = auth.uid()`) | service_role only |
| `stripe_webhook_events` | None | None | service_role only (webhook handler) |
| `products_legacy` (after rename) | None | Authenticated read | service_role only |
| `product_variants_legacy` (after rename) | None | Authenticated read | service_role only |

## Policy SQL

Policies are defined in `database/_archive/rls_final.sql`. Summary:

```sql
-- Active products — anon + authenticated SELECT
CREATE POLICY "anon_select_active_products"
ON products_new FOR SELECT TO anon, authenticated
USING (is_active = true);

-- Available variants — anon + authenticated SELECT
CREATE POLICY "anon_select_available_variants"
ON product_variants_new FOR SELECT TO anon, authenticated
USING (is_available = true);

-- Active categories — anon + authenticated SELECT
CREATE POLICY "anon_select_active_categories"
ON categories FOR SELECT TO anon, authenticated
USING (is_active = true);

-- Category attributes — fully public
CREATE POLICY "anon_select_category_attributes"
ON category_attributes FOR SELECT TO anon, authenticated
USING (true);

-- Promo codes — anon can validate active codes
CREATE POLICY "anon_select_promo_codes"
ON promo_codes FOR SELECT TO anon, authenticated
USING (active = true);

-- Orders — authenticated users see only their own
CREATE POLICY "auth_select_own_orders"
ON orders FOR SELECT TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Order items — follow order ownership
CREATE POLICY "auth_select_own_order_items"
ON order_items FOR SELECT TO authenticated
USING (order_id IN (
  SELECT id FROM orders WHERE user_id = (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
));

-- Checkout carts — users see/create their own
CREATE POLICY "auth_select_own_carts"
ON checkout_carts FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "auth_insert_own_carts"
ON checkout_carts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users — each user reads their own row
CREATE POLICY "auth_select_own_user"
ON users FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());
```

## Storage policies

Defined in `database/_archive/storage_rls.sql`. Summary:

```sql
-- Public read on the 'products' bucket
CREATE POLICY "products_public_read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'products');

-- Service role handles all writes (admin upload endpoint)
-- No explicit write policy needed — service_role bypasses RLS
```

## Key invariants

- **All writes go through admin-gated API routes** using the `service_role` client, which bypasses RLS.
- **No anon writes anywhere.** The only anon actions are SELECT on public product/category data.
- **Sensitive tables** (orders, users, stripe_webhook_events) have no anon access at all.
- **The `stripe_webhook_events` table** is service_role-only. No RLS policy is needed to block anon — the lack of a permissive policy is sufficient denial.
