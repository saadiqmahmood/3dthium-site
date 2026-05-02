-- ============================================================
-- MIGRATION 0002: Rename legacy tables and canonical tables
-- ============================================================
-- PURPOSE
--   Drops the "_new" suffix from the canonical product tables and
--   archives the legacy tables under a "_legacy" suffix.
--
-- PREREQUISITE
--   The backend engineer must update ALL code references BEFORE applying:
--     products_new        → products
--     product_variants_new → product_variants
--     products            → products_legacy   (in admin/metrics.ts, admin/orders/[id].ts)
--     product_variants    → product_variants_legacy
--
--   After applying this migration, update drizzle/schema.ts:
--     productsNew     table name: 'products_new'  → 'products'
--     productVariantsNew table name: 'product_variants_new' → 'product_variants'
--     products        table name: 'products'       → 'products_legacy'
--     productVariants table name: 'product_variants' → 'product_variants_legacy'
--   Then run: npm run db:generate (to resync the snapshot) followed by
--   committing the resulting 000X_snapshot migration.
--
-- ROLLBACK
--   Reverse all four RENAME TABLE statements in inverse order.
-- ============================================================

-- Step 1: Archive legacy tables
ALTER TABLE "products"
  RENAME TO "products_legacy";

ALTER TABLE "product_variants"
  RENAME TO "product_variants_legacy";

-- Step 2: Promote canonical tables to production names
ALTER TABLE "products_new"
  RENAME TO "products";

ALTER TABLE "product_variants_new"
  RENAME TO "product_variants";

-- Step 3: Lock legacy tables — SELECT only for authenticated users
--         (service_role still has full access by default)
ALTER TABLE "products_legacy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_variants_legacy" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_products_legacy"
ON "products_legacy" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "auth_select_product_variants_legacy"
ON "product_variants_legacy" FOR SELECT
TO authenticated
USING (true);
