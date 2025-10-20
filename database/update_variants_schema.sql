-- ============================================
-- UPDATE product_variants_new SCHEMA
-- ============================================
-- Quick migration to add size, color, material fields
-- Run this in Supabase SQL Editor

-- Step 1: Add new columns if they don't exist
ALTER TABLE product_variants_new 
  ADD COLUMN IF NOT EXISTS size VARCHAR(50),
  ADD COLUMN IF NOT EXISTS color VARCHAR(50),
  ADD COLUMN IF NOT EXISTS material VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Step 2: Remove old columns (if they exist from old schema)
ALTER TABLE product_variants_new 
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS in_stock,
  DROP COLUMN IF EXISTS customizable;

-- Step 3: Add unique constraint on SKU
ALTER TABLE product_variants_new
  DROP CONSTRAINT IF EXISTS product_variants_new_sku_key;

ALTER TABLE product_variants_new
  ADD CONSTRAINT product_variants_new_sku_key UNIQUE(sku);

-- Step 4: Add unique constraint on variant combination
ALTER TABLE product_variants_new
  DROP CONSTRAINT IF EXISTS unique_variant_combination;

ALTER TABLE product_variants_new
  ADD CONSTRAINT unique_variant_combination 
  UNIQUE(product_id, size, color, material);

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_variants_product 
  ON product_variants_new(product_id);

CREATE INDEX IF NOT EXISTS idx_variants_size 
  ON product_variants_new(size) 
  WHERE size IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_variants_color 
  ON product_variants_new(color) 
  WHERE color IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_variants_material 
  ON product_variants_new(material) 
  WHERE material IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_variants_sku 
  ON product_variants_new(sku) 
  WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_variants_availability 
  ON product_variants_new(is_available) 
  WHERE is_available = true;

-- Step 6: Update columns to NOT NULL where appropriate
ALTER TABLE product_variants_new
  ALTER COLUMN product_id SET NOT NULL,
  ALTER COLUMN price_adjustment SET NOT NULL,
  ALTER COLUMN price_adjustment SET DEFAULT 0,
  ALTER COLUMN stock_quantity SET NOT NULL,
  ALTER COLUMN stock_quantity SET DEFAULT 0,
  ALTER COLUMN is_available SET NOT NULL,
  ALTER COLUMN is_available SET DEFAULT true;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN product_variants_new.size IS 'Physical size (e.g., "150mm", "180mm", "210mm")';
COMMENT ON COLUMN product_variants_new.color IS 'Color name (e.g., "White", "Black", "Red")';
COMMENT ON COLUMN product_variants_new.material IS 'Material type (e.g., "PLA", "PETG", "Resin")';
COMMENT ON COLUMN product_variants_new.sku IS 'Stock Keeping Unit - auto-generated if not provided';
COMMENT ON COLUMN product_variants_new.stock_quantity IS '0 = print-on-demand (no stock tracking), >0 = pre-made inventory';
COMMENT ON COLUMN product_variants_new.is_available IS 'Whether this variant can be purchased (hide without deleting)';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'product_variants_new'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Schema updated successfully! ✅';
  RAISE NOTICE 'Columns added: size, color, material, sku, stock_quantity, is_available';
  RAISE NOTICE 'You can now test variant creation in the admin panel.';
END $$;

