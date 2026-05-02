-- Debug script to check what products exist and their slugs
-- Run this in Supabase SQL Editor to see what's in your database

-- Check if products_new table exists and has data
SELECT 
  id,
  name,
  slug,
  is_active,
  created_at
FROM products_new 
ORDER BY created_at DESC
LIMIT 10;

-- Check if the specific products exist
SELECT 
  id,
  name,
  slug,
  is_active
FROM products_new 
WHERE slug IN ('test-product-one', 'test-product-2', 'test-product-1')
ORDER BY slug;

-- Check total count of products
SELECT COUNT(*) as total_products FROM products_new;

-- Check if RLS is enabled and what policies exist
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('products_new', 'product_variants_new', 'categories', 'category_attributes')
ORDER BY tablename, policyname;

