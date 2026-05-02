-- Quick fix: Check if products have valid category_id
SELECT 
  p.id,
  p.name,
  p.slug,
  p.category_id,
  c.name as category_name
FROM products_new p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.slug IN ('test-product-2', 'test-product-one');

