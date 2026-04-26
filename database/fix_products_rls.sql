-- DEPRECATED: Superseded by database/rls_final.sql.
-- Fix RLS policies for products_new table
-- This allows public read access to products for the frontend

-- Allow public read access to products_new
CREATE POLICY "Allow public read access to products_new"
ON products_new FOR SELECT
USING (true);

-- Allow public read access to product_variants_new
CREATE POLICY "Allow public read access to product variants"
ON product_variants_new FOR SELECT
USING (true);

-- Allow public read access to categories
CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT
USING (true);

-- Allow public read access to category_attributes
CREATE POLICY "Allow public read access to category attributes"
ON category_attributes FOR SELECT
USING (true);

