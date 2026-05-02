-- Update products_new table to support enhanced image management
-- This script adds support for separate thumbnail and gallery images, plus crop data

-- First, add the images column if it doesn't exist (for backward compatibility)
ALTER TABLE products_new 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add new columns for enhanced image management
ALTER TABLE products_new 
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS image_crops JSONB DEFAULT '{}'::jsonb;

-- Add column for storing crop data for each image
-- This will store crop coordinates and dimensions for positioning
COMMENT ON COLUMN products_new.image_crops IS 'Stores crop data for images: {"image_url": {"x": 0, "y": 0, "width": 400, "height": 400}}';

-- Update existing products to migrate from old images array to new structure
-- This assumes the first image in the old images array becomes the thumbnail
UPDATE products_new 
SET 
  thumbnail_url = CASE 
    WHEN jsonb_array_length(images) > 0 THEN images->0
    ELSE NULL
  END,
  gallery_images = CASE 
    WHEN jsonb_array_length(images) > 1 THEN images - 0
    ELSE '[]'::jsonb
  END
WHERE images IS NOT NULL AND jsonb_array_length(images) > 0;

-- Create index for thumbnail_url for faster queries
CREATE INDEX IF NOT EXISTS idx_products_new_thumbnail_url ON products_new(thumbnail_url);

-- Create index for gallery_images for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_products_new_gallery_images ON products_new USING GIN (gallery_images);

-- Create index for image_crops for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_products_new_image_crops ON products_new USING GIN (image_crops);

-- Create index for images (legacy) for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_products_new_images ON products_new USING GIN (images);

-- Add constraint to ensure thumbnail_url is not empty if provided
ALTER TABLE products_new 
ADD CONSTRAINT check_thumbnail_url_not_empty 
CHECK (thumbnail_url IS NULL OR trim(thumbnail_url) != '');

-- Add constraint to ensure gallery_images is always an array
ALTER TABLE products_new 
ADD CONSTRAINT check_gallery_images_is_array 
CHECK (jsonb_typeof(gallery_images) = 'array');

-- Add constraint to ensure images is always an array
ALTER TABLE products_new 
ADD CONSTRAINT check_images_is_array 
CHECK (jsonb_typeof(images) = 'array');

-- Function to update image crops
CREATE OR REPLACE FUNCTION update_image_crop(
  product_id UUID,
  image_url TEXT,
  crop_data JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE products_new 
  SET image_crops = COALESCE(image_crops, '{}'::jsonb) || jsonb_build_object(image_url, crop_data)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get all images for a product (thumbnail + gallery)
CREATE OR REPLACE FUNCTION get_product_all_images(product_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_array(
    COALESCE(thumbnail_url, ''),
    COALESCE(gallery_images, '[]'::jsonb)
  ) INTO result
  FROM products_new 
  WHERE id = product_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to sync images array with thumbnail and gallery (for backward compatibility)
CREATE OR REPLACE FUNCTION sync_product_images(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products_new 
  SET images = CASE 
    WHEN thumbnail_url IS NOT NULL AND jsonb_array_length(gallery_images) > 0 
    THEN jsonb_build_array(thumbnail_url) || gallery_images
    WHEN thumbnail_url IS NOT NULL 
    THEN jsonb_build_array(thumbnail_url)
    ELSE gallery_images
  END
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_image_crop(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_all_images(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_product_images(UUID) TO authenticated;

-- Update RLS policies to include new columns
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active products" ON products_new;
DROP POLICY IF EXISTS "Service role can manage products" ON products_new;

-- Recreate policies with new columns
CREATE POLICY "Public can view active products" ON products_new
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage products" ON products_new
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE products_new IS 'Enhanced products table with separate thumbnail and gallery images, plus crop data support';
COMMENT ON COLUMN products_new.thumbnail_url IS 'Main product thumbnail image URL';
COMMENT ON COLUMN products_new.gallery_images IS 'Array of additional product image URLs';
COMMENT ON COLUMN products_new.images IS 'Legacy images array - kept for backward compatibility';

-- Create a view for easy access to all product images
CREATE OR REPLACE VIEW product_images_view AS
SELECT 
  id,
  name,
  thumbnail_url,
  gallery_images,
  image_crops,
  -- Combine thumbnail and gallery for backward compatibility
  CASE 
    WHEN thumbnail_url IS NOT NULL AND jsonb_array_length(gallery_images) > 0 
    THEN jsonb_build_array(thumbnail_url) || gallery_images
    WHEN thumbnail_url IS NOT NULL 
    THEN jsonb_build_array(thumbnail_url)
    ELSE gallery_images
  END as all_images
FROM products_new;

-- Grant access to the view
GRANT SELECT ON product_images_view TO authenticated;
GRANT SELECT ON product_images_view TO anon;

-- Example usage:
-- SELECT * FROM product_images_view WHERE id = 'your-product-id';
-- SELECT update_image_crop('product-id', 'image-url', '{"x": 0, "y": 0, "width": 400, "height": 400}');
-- SELECT get_product_all_images('product-id');
-- SELECT sync_product_images('product-id'); 