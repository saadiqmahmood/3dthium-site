-- Quick check: What products actually exist?
-- Run this in Supabase SQL Editor

SELECT 
  id,
  name,
  slug,
  is_active,
  created_at
FROM products_new 
WHERE is_active = true
ORDER BY created_at DESC;

