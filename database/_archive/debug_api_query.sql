-- Debug: Test the exact query that the API is running
-- This will help us see what's failing

-- Test 1: Basic product fetch (what the API does)
SELECT 
  id,
  name,
  description,
  slug,
  base_price,
  thumbnail_url,
  images,
  gallery_images,
  is_active,
  customizable,
  attributes,
  created_at,
  updated_at
FROM products_new 
WHERE slug = 'test-product-2' 
  AND is_active = true;

-- Test 2: Check if categories table has data
SELECT 
  id,
  name,
  slug
FROM categories
LIMIT 5;

-- Test 3: Check the join (this might be failing)
SELECT 
  p.id,
  p.name,
  p.slug,
  c.name as category_name,
  c.slug as category_slug
FROM products_new p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.slug = 'test-product-2' 
  AND p.is_active = true;

