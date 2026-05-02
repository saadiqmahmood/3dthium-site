-- ============================================================
-- MIGRATION 0003: FK constraints on order_items
-- ============================================================
-- Deferred from migration 0002 until tables were renamed.
-- order_items.product_id → products(id)
-- order_items.variant_id → product_variants(id)
--
-- Historical rows that reference products_legacy will have NULL
-- product_id/variant_id after this — those orders are displayed
-- via the products_legacy join in admin/orders/[id].ts.
-- ============================================================

-- Nullify any order_items rows that reference the now-gone
-- products/product_variants legacy UUIDs so FK addition doesn't fail.
UPDATE "order_items"
SET "product_id" = NULL
WHERE "product_id" IS NOT NULL
  AND "product_id" NOT IN (SELECT id FROM "products");

UPDATE "order_items"
SET "variant_id" = NULL
WHERE "variant_id" IS NOT NULL
  AND "variant_id" NOT IN (SELECT id FROM "product_variants");

-- Add FK constraints
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk"
  FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
