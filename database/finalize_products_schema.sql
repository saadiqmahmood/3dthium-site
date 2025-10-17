-- Final schema update for products_new table
-- Adds all missing columns needed for the new product creation flow

-- Add missing columns to products_new
ALTER TABLE products_new 
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS customizable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_crops JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN products_new.images IS 'Array of all image URLs for the product (thumbnail + gallery)';
COMMENT ON COLUMN products_new.thumbnail_url IS 'Primary product thumbnail URL (first image)';
COMMENT ON COLUMN products_new.gallery_images IS 'Array of gallery image URLs (excluding thumbnail)';
COMMENT ON COLUMN products_new.image_crops IS 'Crop data for each image {url: {x, y, width, height}}';
COMMENT ON COLUMN products_new.customizable IS 'Whether this product can be customized';

-- Create index on images for faster queries
CREATE INDEX IF NOT EXISTS idx_products_new_images ON products_new USING GIN (images);

-- Create a helper view to get product with all details
CREATE OR REPLACE VIEW products_with_details AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.description,
  p.category_id,
  p.base_price,
  p.thumbnail_url,
  p.images,
  p.gallery_images,
  p.is_active,
  p.customizable,
  p.attributes,
  p.created_at,
  p.updated_at,
  c.name as category_name,
  c.slug as category_slug,
  (SELECT COUNT(*) FROM product_variants_new WHERE product_id = p.id) as variant_count
FROM products_new p
LEFT JOIN categories c ON p.category_id = c.id;

-- Grant permissions
GRANT SELECT ON products_with_details TO authenticated;
GRANT SELECT ON products_with_details TO anon;

-- Create helper function to sync image arrays
CREATE OR REPLACE FUNCTION sync_product_images()
RETURNS TRIGGER AS $$
BEGIN
  -- If thumbnail_url or gallery_images change, update images array
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Combine thumbnail and gallery into images array
    NEW.images := COALESCE(
      (
        SELECT jsonb_agg(img) 
        FROM (
          SELECT NEW.thumbnail_url as img
          UNION ALL
          SELECT jsonb_array_elements_text(COALESCE(NEW.gallery_images, '[]'::jsonb))
        ) t
        WHERE img IS NOT NULL AND img != ''
      ),
      '[]'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync images
DROP TRIGGER IF EXISTS trg_sync_product_images ON products_new;
CREATE TRIGGER trg_sync_product_images
  BEFORE INSERT OR UPDATE ON products_new
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_images();

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products_new' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

