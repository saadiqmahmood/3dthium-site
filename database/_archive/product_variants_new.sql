-- ============================================
-- PRODUCT VARIANTS SYSTEM FOR products_new
-- ============================================
-- Created: 2025-10-20
-- Purpose: Enable size, color, and material variants for products_new table
-- 
-- Usage:
--   1. Run this in Supabase SQL Editor
--   2. Variants link to products_new via product_id
--   3. Each variant has optional size, color, material
--   4. price_adjustment adds/subtracts from base_price
--   5. SKU auto-generated in API if not provided
-- ============================================

-- Create product_variants_new table
CREATE TABLE IF NOT EXISTS product_variants_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products_new(id) ON DELETE CASCADE,
  
  -- Variant attributes (at least one required)
  size VARCHAR(50),           -- "150mm", "180mm", "210mm", "240mm"
  color VARCHAR(50),          -- "White", "Black", "Red", "Blue"
  material VARCHAR(50),       -- "PLA", "PETG", "Resin"
  
  -- Pricing
  -- Final price = products_new.base_price + price_adjustment
  -- Example: base_price £20, adjustment +£5 = £25 final
  price_adjustment DECIMAL(10,2) DEFAULT 0 NOT NULL,
  
  -- Optional fields
  sku VARCHAR(100) UNIQUE,    -- e.g., "GEO-VASE-150-WHT-PLA"
  image_url TEXT,             -- Variant-specific image (optional, fallback to product thumbnail)
  stock_quantity INTEGER DEFAULT 0 NOT NULL,  -- 0 = print-on-demand (no stock tracking)
  is_available BOOLEAN DEFAULT true NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  -- Ensure unique combinations (can't have duplicate size+color+material for same product)
  CONSTRAINT unique_variant_combination UNIQUE(product_id, size, color, material),
  
  -- At least one attribute must be set
  CONSTRAINT at_least_one_attribute CHECK (
    size IS NOT NULL OR color IS NOT NULL OR material IS NOT NULL
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_variants_product 
  ON product_variants_new(product_id);

CREATE INDEX IF NOT EXISTS idx_variants_sku 
  ON product_variants_new(sku) 
  WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_variants_availability 
  ON product_variants_new(is_available) 
  WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_variants_size 
  ON product_variants_new(size) 
  WHERE size IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_variants_color 
  ON product_variants_new(color) 
  WHERE color IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_variants_material 
  ON product_variants_new(material) 
  WHERE material IS NOT NULL;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_variant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_variant_updated_at ON product_variants_new;
CREATE TRIGGER trigger_variant_updated_at
  BEFORE UPDATE ON product_variants_new
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE product_variants_new ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public can view available variants (for product pages)
DROP POLICY IF EXISTS "Public can view available variants" ON product_variants_new;
CREATE POLICY "Public can view available variants"
  ON product_variants_new
  FOR SELECT
  USING (
    is_available = true 
    AND EXISTS (
      SELECT 1 FROM products_new 
      WHERE products_new.id = product_variants_new.product_id 
      AND products_new.is_active = true
    )
  );

-- Policy 2: Authenticated users can view all variants
DROP POLICY IF EXISTS "Authenticated users can view all variants" ON product_variants_new;
CREATE POLICY "Authenticated users can view all variants"
  ON product_variants_new
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Only admins can insert variants
DROP POLICY IF EXISTS "Admins can insert variants" ON product_variants_new;
CREATE POLICY "Admins can insert variants"
  ON product_variants_new
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy 4: Only admins can update variants
DROP POLICY IF EXISTS "Admins can update variants" ON product_variants_new;
CREATE POLICY "Admins can update variants"
  ON product_variants_new
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy 5: Only admins can delete variants
DROP POLICY IF EXISTS "Admins can delete variants" ON product_variants_new;
CREATE POLICY "Admins can delete variants"
  ON product_variants_new
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ============================================
-- DOCUMENTATION
-- ============================================

COMMENT ON TABLE product_variants_new IS 
  'Product variants for products_new table with size, color, and material options. Used for print-on-demand e-commerce.';

COMMENT ON COLUMN product_variants_new.product_id IS 
  'Foreign key to products_new. Cascades on delete (deleting product deletes variants).';

COMMENT ON COLUMN product_variants_new.size IS 
  'Physical size of the product (e.g., "150mm", "180mm", "210mm", "240mm"). Optional.';

COMMENT ON COLUMN product_variants_new.color IS 
  'Color name (e.g., "White", "Black", "Red", "Blue"). Optional.';

COMMENT ON COLUMN product_variants_new.material IS 
  'Material type (e.g., "PLA", "PETG", "Resin"). Optional for 3D printing.';

COMMENT ON COLUMN product_variants_new.price_adjustment IS 
  'Amount to add/subtract from products_new.base_price. Positive = more expensive, negative = cheaper. Example: base_price £20, adjustment +£5 = £25 final.';

COMMENT ON COLUMN product_variants_new.sku IS 
  'Stock Keeping Unit. Unique identifier for this variant. Auto-generated in API if not provided.';

COMMENT ON COLUMN product_variants_new.image_url IS 
  'Optional variant-specific image URL. If null, falls back to products_new.thumbnail_url.';

COMMENT ON COLUMN product_variants_new.stock_quantity IS 
  '0 = print-on-demand (no stock tracking), >0 = pre-made inventory. Default 0 for print-on-demand business model.';

COMMENT ON COLUMN product_variants_new.is_available IS 
  'Whether this variant can be purchased. Set to false to hide from customers without deleting.';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count variants per product
-- SELECT 
--   p.name, 
--   COUNT(v.id) as variant_count
-- FROM products_new p
-- LEFT JOIN product_variants_new v ON v.product_id = p.id
-- GROUP BY p.id, p.name
-- ORDER BY variant_count DESC;

-- List all variants with final prices
-- SELECT 
--   p.name as product_name,
--   v.size,
--   v.color,
--   v.material,
--   p.base_price,
--   v.price_adjustment,
--   (p.base_price + v.price_adjustment) as final_price,
--   v.sku
-- FROM product_variants_new v
-- JOIN products_new p ON p.id = v.product_id
-- WHERE v.is_available = true
-- ORDER BY p.name, final_price;

-- ============================================
-- EXAMPLE DATA (for testing)
-- ============================================

-- Uncomment to insert example variants (replace product_id with actual UUID)

-- INSERT INTO product_variants_new (product_id, size, color, material, price_adjustment, sku) VALUES
-- -- Small sizes (cheaper)
-- ('YOUR-PRODUCT-UUID-HERE', '150mm', 'White', 'PLA', -8.00, 'PROD-150-WHT-PLA'),
-- ('YOUR-PRODUCT-UUID-HERE', '150mm', 'Black', 'PLA', -8.00, 'PROD-150-BLK-PLA'),
-- 
-- -- Medium sizes (base price)
-- ('YOUR-PRODUCT-UUID-HERE', '180mm', 'White', 'PLA', 0.00, 'PROD-180-WHT-PLA'),
-- ('YOUR-PRODUCT-UUID-HERE', '180mm', 'Black', 'PLA', 0.00, 'PROD-180-BLK-PLA'),
-- ('YOUR-PRODUCT-UUID-HERE', '180mm', 'Red', 'PLA', 0.00, 'PROD-180-RED-PLA'),
-- 
-- -- Large sizes (more expensive)
-- ('YOUR-PRODUCT-UUID-HERE', '210mm', 'White', 'PETG', 5.00, 'PROD-210-WHT-PETG'),
-- ('YOUR-PRODUCT-UUID-HERE', '210mm', 'Black', 'PETG', 5.00, 'PROD-210-BLK-PETG'),
-- 
-- -- Extra large (premium)
-- ('YOUR-PRODUCT-UUID-HERE', '240mm', 'Blue', 'Resin', 15.00, 'PROD-240-BLU-RES');

-- ============================================
-- DONE! Schema is ready.
-- Next steps:
--   1. Run this SQL in Supabase SQL Editor
--   2. Create TypeScript types in types/index.ts
--   3. Build API endpoints in pages/api/admin/product-variants/
--   4. Create VariantManager component
-- ============================================

