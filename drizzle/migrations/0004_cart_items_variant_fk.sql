-- ============================================================
-- MIGRATION 0004: Fix cart_items.variant_id FK to allow variant deletion
-- ============================================================
-- The original schema created cart_items_variant_id_fkey with no
-- ON DELETE clause (defaults to RESTRICT), blocking variant deletion
-- when cart rows reference the variant. Migration 0003 fixed order_items
-- but missed cart_items. This migration drops and re-adds the FK with
-- ON DELETE CASCADE so deleting a variant removes the associated cart
-- items — the product disappears from the customer's cart cleanly.
-- ============================================================

ALTER TABLE "cart_items"
  DROP CONSTRAINT IF EXISTS "cart_items_variant_id_fkey";

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
