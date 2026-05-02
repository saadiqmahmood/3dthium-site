-- Canonical RLS policy set for 3dthium data tables.
-- This is the authoritative document — all other RLS files are DEPRECATED.
-- Apply these in Supabase SQL Editor. The DBA engineer should convert these
-- to Drizzle migrations as part of Wave 2 work.
--
-- Policy intent:
--   Public tables: SELECT for anon; no anon writes anywhere.
--   All writes go through admin-gated API routes using the service_role client
--   (which bypasses RLS by definition — so no write policies are needed here).
--
-- Tables covered:
--   products_new, product_variants_new, categories, category_attributes
--   promo_codes (validate = SELECT only by anon)
--   orders, order_items, checkout_carts, users — NO anon access (admin only)

-- =============================================================================
-- 1. Enable RLS on all tables (idempotent)
-- =============================================================================
ALTER TABLE products_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. Drop existing policies (clean slate)
-- =============================================================================
DROP POLICY IF EXISTS "Allow public read access to products_new" ON products_new;
DROP POLICY IF EXISTS "Allow public read access to product variants" ON product_variants_new;
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to category attributes" ON category_attributes;

-- =============================================================================
-- 3. Public read policies (anon + authenticated can SELECT)
-- =============================================================================

-- Active products only — inactive products are hidden from the public API.
CREATE POLICY "anon_select_active_products"
ON products_new FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Active variants only.
CREATE POLICY "anon_select_available_variants"
ON product_variants_new FOR SELECT
TO anon, authenticated
USING (is_available = true);

-- All active categories.
CREATE POLICY "anon_select_active_categories"
ON categories FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Category attributes — fully public.
CREATE POLICY "anon_select_category_attributes"
ON category_attributes FOR SELECT
TO anon, authenticated
USING (true);

-- Promo codes: anon can validate (SELECT) but not write.
CREATE POLICY "anon_select_promo_codes"
ON promo_codes FOR SELECT
TO anon, authenticated
USING (active = true);

-- =============================================================================
-- 4. Sensitive tables — NO anon access; authenticated users see only their own.
-- =============================================================================

-- orders: users see only their own orders.
CREATE POLICY "auth_select_own_orders"
ON orders FOR SELECT
TO authenticated
USING (
  user_id = (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- order_items: follow the order ownership.
CREATE POLICY "auth_select_own_order_items"
ON order_items FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders
    WHERE user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
);

-- checkout_carts: users see only their own carts.
CREATE POLICY "auth_select_own_carts"
ON checkout_carts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "auth_insert_own_carts"
ON checkout_carts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- users: each user can read their own row.
CREATE POLICY "auth_select_own_user"
ON users FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- =============================================================================
-- 5. Notes for DBA engineer
-- =============================================================================
-- * Admin writes (INSERT/UPDATE/DELETE on any table) happen through the
--   service_role client in admin API routes. service_role bypasses RLS.
-- * The stripe_webhook_events table should be service_role-only (no RLS policy
--   needed — just ensure anon role has no access by not creating one).
-- * This file replaces: fix_products_rls.sql, setup_public_rls_policies.sql,
--   and any inline CREATE POLICY statements in other database/*.sql files.
