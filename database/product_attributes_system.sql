-- ============================================
-- PRODUCT ATTRIBUTES SYSTEM
-- ============================================
-- Created: 2025-11-06
-- Purpose: Enable bulk variation generation with attribute-based image inheritance
-- 
-- This replaces the manual one-by-one variation creation with:
--   1. Define attributes (Color, Height, Material, Design)
--   2. Add options to each attribute (Red, Blue, Green...)
--   3. Upload images per attribute option
--   4. Generate all combinations automatically
--   5. Smart image inheritance (Red variants get Red images)
-- ============================================

-- Table 1: Product Attributes
-- Defines what attributes a product can have (e.g., Color, Height, Design)
CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products_new(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  -- e.g., "Color", "Height", "Material", "Design Pattern"
  
  type TEXT NOT NULL CHECK (type IN ('color', 'size', 'material', 'design', 'custom')),
  -- Helps UI render appropriate input (color picker, dropdown, etc.)
  
  display_order INTEGER DEFAULT 0,
  -- Order to display attributes in UI
  
  required BOOLEAN DEFAULT TRUE,
  -- Whether this attribute must be selected when purchasing
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique attribute names per product
  CONSTRAINT unique_product_attribute_name UNIQUE(product_id, name)
);

-- Table 2: Product Attribute Options
-- Stores the possible values for each attribute (e.g., Red, Blue, Green for Color)
CREATE TABLE IF NOT EXISTS product_attribute_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  
  value TEXT NOT NULL,
  -- Machine-readable value: "red", "small", "ceramic"
  
  display_name TEXT NOT NULL,
  -- Human-readable: "Crimson Red", "6 inch", "Glazed Ceramic"
  
  hex_color TEXT,
  -- For color swatches: "#FF0000" (only used if type is 'color')
  
  images JSONB DEFAULT '[]'::jsonb,
  -- Images specific to this option: ["red-vase-1.jpg", "red-vase-2.jpg"]
  -- These will be inherited by all variations with this option
  
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  -- Price adjustment for this option: +5.00 for Large, -2.00 for Small
  
  display_order INTEGER DEFAULT 0,
  -- Order to display options in UI
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique option values per attribute
  CONSTRAINT unique_attribute_option_value UNIQUE(attribute_id, value)
);

-- Update product_variants_new table with new columns
ALTER TABLE product_variants_new
  ADD COLUMN IF NOT EXISTS attribute_values JSONB DEFAULT '{}'::jsonb,
  -- Stores: {"color": "red", "height": "small", "material": "ceramic"}
  -- This replaces the need for separate size/color/material columns
  
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE,
  -- Track if created by bulk generator vs manual entry
  
  ADD COLUMN IF NOT EXISTS image_sources JSONB DEFAULT '{}'::jsonb,
  -- Track which images came from which attributes
  -- e.g., {"color": ["red-1.jpg"], "design": ["pattern-a.jpg"]}
  
  ADD COLUMN IF NOT EXISTS custom_images JSONB DEFAULT '[]'::jsonb;
  -- Manual image overrides for this specific variant
  -- Takes priority over inherited images

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id 
  ON product_attributes(product_id);

CREATE INDEX IF NOT EXISTS idx_product_attributes_type 
  ON product_attributes(type);

CREATE INDEX IF NOT EXISTS idx_attribute_options_attribute_id 
  ON product_attribute_options(attribute_id);

CREATE INDEX IF NOT EXISTS idx_variants_attribute_values 
  ON product_variants_new USING GIN (attribute_values);
  -- GIN index for JSONB queries (filtering by attribute values)

CREATE INDEX IF NOT EXISTS idx_variants_auto_generated 
  ON product_variants_new(auto_generated) 
  WHERE auto_generated = true;

-- Auto-update timestamp triggers
CREATE OR REPLACE FUNCTION update_attribute_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_attribute_updated_at ON product_attributes;
CREATE TRIGGER trigger_attribute_updated_at
  BEFORE UPDATE ON product_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_attribute_updated_at();

DROP TRIGGER IF EXISTS trigger_attribute_option_updated_at ON product_attribute_options;
CREATE TRIGGER trigger_attribute_option_updated_at
  BEFORE UPDATE ON product_attribute_options
  FOR EACH ROW
  EXECUTE FUNCTION update_attribute_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_options ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view attributes for active products
DROP POLICY IF EXISTS "Public can view product attributes" ON product_attributes;
CREATE POLICY "Public can view product attributes"
  ON product_attributes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products_new 
      WHERE products_new.id = product_attributes.product_id 
      AND products_new.is_active = true
    )
  );

-- Policy: Public can view attribute options
DROP POLICY IF EXISTS "Public can view attribute options" ON product_attribute_options;
CREATE POLICY "Public can view attribute options"
  ON product_attribute_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_attributes 
      WHERE product_attributes.id = product_attribute_options.attribute_id
    )
  );

-- Policy: Service role can manage everything (for API routes)
DROP POLICY IF EXISTS "Service role can manage product attributes" ON product_attributes;
CREATE POLICY "Service role can manage product attributes"
  ON product_attributes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage attribute options" ON product_attribute_options;
CREATE POLICY "Service role can manage attribute options"
  ON product_attribute_options
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Admins can manage attributes (when using authenticated connection)
DROP POLICY IF EXISTS "Admins can manage product attributes" ON product_attributes;
CREATE POLICY "Admins can manage product attributes"
  ON product_attributes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Policy: Admins can manage attribute options (when using authenticated connection)
DROP POLICY IF EXISTS "Admins can manage attribute options" ON product_attribute_options;
CREATE POLICY "Admins can manage attribute options"
  ON product_attribute_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- ============================================
-- HELPER VIEWS (Optional - for convenience)
-- ============================================

-- View: Products with their attributes and options
CREATE OR REPLACE VIEW v_products_with_attributes AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.slug as product_slug,
  pa.id as attribute_id,
  pa.name as attribute_name,
  pa.type as attribute_type,
  pao.id as option_id,
  pao.value as option_value,
  pao.display_name as option_display_name,
  pao.hex_color,
  pao.images as option_images,
  pao.price_modifier
FROM products_new p
LEFT JOIN product_attributes pa ON pa.product_id = p.id
LEFT JOIN product_attribute_options pao ON pao.attribute_id = pa.id
ORDER BY p.name, pa.display_order, pao.display_order;

-- ============================================
-- EXAMPLE DATA (for testing)
-- ============================================

-- Uncomment to insert example attributes for a product

/*
-- Example: Vase with Color, Height, and Design attributes

-- 1. Insert attributes
INSERT INTO product_attributes (product_id, name, type, display_order) VALUES
('YOUR-PRODUCT-UUID', 'Color', 'color', 1),
('YOUR-PRODUCT-UUID', 'Height', 'size', 2),
('YOUR-PRODUCT-UUID', 'Design', 'design', 3);

-- 2. Insert options for Color
INSERT INTO product_attribute_options (attribute_id, value, display_name, hex_color, images, price_modifier) VALUES
((SELECT id FROM product_attributes WHERE product_id = 'YOUR-PRODUCT-UUID' AND name = 'Color'), 
 'red', 'Crimson Red', '#DC143C', '["red-1.jpg", "red-2.jpg"]'::jsonb, 0),
((SELECT id FROM product_attributes WHERE product_id = 'YOUR-PRODUCT-UUID' AND name = 'Color'), 
 'blue', 'Ocean Blue', '#0077BE', '["blue-1.jpg"]'::jsonb, 0),
((SELECT id FROM product_attributes WHERE product_id = 'YOUR-PRODUCT-UUID' AND name = 'Color'), 
 'green', 'Forest Green', '#228B22', '["green-1.jpg"]'::jsonb, 0);

-- 3. Insert options for Height
INSERT INTO product_attribute_options (attribute_id, value, display_name, price_modifier) VALUES
((SELECT id FROM product_attributes WHERE product_id = 'YOUR-PRODUCT-UUID' AND name = 'Height'), 
 'small', '6 inch', -5.00),
((SELECT id FROM product_attributes WHERE product_id = 'YOUR-PRODUCT-UUID' AND name = 'Height'), 
 'medium', '8 inch', 0.00),
((SELECT id FROM product_attributes WHERE product_id = 'YOUR-PRODUCT-UUID' AND name = 'Height'), 
 'large', '10 inch', 5.00);

-- 4. Insert options for Design
INSERT INTO product_attribute_options (attribute_id, value, display_name, images) VALUES
((SELECT id FROM product_attributes WHERE product_id = 'YOUR-PRODUCT-UUID' AND name = 'Design'), 
 'smooth', 'Smooth Finish', '["smooth-detail.jpg"]'::jsonb),
((SELECT id FROM product_attributes WHERE product_id = 'YOUR-PRODUCT-UUID' AND name = 'Design'), 
 'ribbed', 'Ribbed Pattern', '["ribbed-detail.jpg"]'::jsonb);

-- This creates: 3 colors × 3 heights × 2 designs = 18 possible variations
-- Use the variation generator API to create them automatically!
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check attributes for a product
-- SELECT * FROM v_products_with_attributes WHERE product_id = 'YOUR-UUID';

-- Count how many combinations are possible
-- SELECT 
--   p.name,
--   (SELECT COUNT(*) FROM product_attribute_options pao1 
--    JOIN product_attributes pa1 ON pa1.id = pao1.attribute_id 
--    WHERE pa1.product_id = p.id AND pa1.name = 'Color') as colors,
--   (SELECT COUNT(*) FROM product_attribute_options pao2 
--    JOIN product_attributes pa2 ON pa2.id = pao2.attribute_id 
--    WHERE pa2.product_id = p.id AND pa2.name = 'Height') as heights,
--   (SELECT COUNT(*) FROM product_attribute_options pao3 
--    JOIN product_attributes pa3 ON pa3.id = pao3.attribute_id 
--    WHERE pa3.product_id = p.id AND pa3.name = 'Design') as designs
-- FROM products_new p;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To remove this feature:
-- DROP VIEW IF EXISTS v_products_with_attributes;
-- DROP TABLE IF EXISTS product_attribute_options CASCADE;
-- DROP TABLE IF EXISTS product_attributes CASCADE;
-- ALTER TABLE product_variants_new 
--   DROP COLUMN IF EXISTS attribute_values,
--   DROP COLUMN IF EXISTS auto_generated,
--   DROP COLUMN IF EXISTS image_sources,
--   DROP COLUMN IF EXISTS custom_images;

-- ============================================
-- DONE! Next steps:
--   1. Run this SQL in Supabase SQL Editor
--   2. Create API endpoints for attribute management
--   3. Create variation generator API
--   4. Build UI components
-- ============================================

