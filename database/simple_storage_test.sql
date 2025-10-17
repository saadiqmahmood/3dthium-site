-- Simple storage test - let's actually try to insert a file
-- This will show us exactly what's blocking the uploads

-- 1. Check if products bucket exists
SELECT 
  id,
  name,
  public
FROM storage.buckets 
WHERE name = 'products';

-- 2. Try to insert a test file (this should work with our policies)
-- If this fails, we'll see the exact error
DO $$
DECLARE
  bucket_id text;
BEGIN
  -- Get the products bucket ID
  SELECT id INTO bucket_id FROM storage.buckets WHERE name = 'products';
  
  IF bucket_id IS NULL THEN
    RAISE NOTICE 'Products bucket does not exist!';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testing insert into bucket: %', bucket_id;
  
  -- Try the insert
  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES (bucket_id, 'test-file.txt', '00000000-0000-0000-0000-000000000000', '{"test": true}'::jsonb);
  
  RAISE NOTICE 'SUCCESS: File inserted successfully!';
  
  -- Clean up
  DELETE FROM storage.objects WHERE name = 'test-file.txt' AND bucket_id = bucket_id;
  RAISE NOTICE 'Test file cleaned up';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: Insert failed with: %', SQLERRM;
  RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 3. Check if the test file was created (should be cleaned up)
SELECT 
  name,
  bucket_id,
  created_at
FROM storage.objects 
WHERE name = 'test-file.txt';

-- 4. If the insert worked, let's also test with a more realistic file path
DO $$
DECLARE
  bucket_id text;
BEGIN
  SELECT id INTO bucket_id FROM storage.buckets WHERE name = 'products';
  
  IF bucket_id IS NULL THEN
    RAISE NOTICE 'No products bucket to test with';
    RETURN;
  END IF;
  
  -- Try with a realistic product image path
  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES (bucket_id, 'vases/test-product/image1.jpg', '00000000-0000-0000-0000-000000000000', '{"content_type": "image/jpeg"}'::jsonb);
  
  RAISE NOTICE 'SUCCESS: Product image path works!';
  
  -- Clean up
  DELETE FROM storage.objects WHERE name = 'vases/test-product/image1.jpg' AND bucket_id = bucket_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: Product image insert failed: %', SQLERRM;
END $$; 