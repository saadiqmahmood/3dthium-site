-- Comprehensive RLS policy setup for public access
-- Run this in Supabase SQL Editor to ensure all policies are correct

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to products_new" ON products_new;
DROP POLICY IF EXISTS "Allow public read access to product variants" ON product_variants_new;
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to category attributes" ON category_attributes;

-- Create new policies for public read access
CREATE POLICY "Allow public read access to products_new"
ON products_new FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to product variants"
ON product_variants_new FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to category attributes"
ON category_attributes FOR SELECT
USING (true);

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('products_new', 'product_variants_new', 'categories', 'category_attributes')
ORDER BY tablename, policyname;

