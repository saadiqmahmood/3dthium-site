-- Final storage test and fix
-- Let's get this working once and for all

-- 1. Check current policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 2. Fix public select permissions
GRANT SELECT ON storage.objects TO public;

-- 3. Test permissions again
SELECT 
  has_table_privilege('authenticated', 'storage.objects', 'INSERT') as authenticated_can_insert,
  has_table_privilege('public', 'storage.objects', 'SELECT') as public_can_select,
  has_table_privilege('authenticated', 'storage.objects', 'UPDATE') as authenticated_can_update,
  has_table_privilege('authenticated', 'storage.objects', 'DELETE') as authenticated_can_delete;

-- 4. Let's test if we can actually insert a test record
-- This will help identify if there are other constraints
DO $$
DECLARE
  test_bucket_id text;
BEGIN
  -- Get the products bucket ID
  SELECT id INTO test_bucket_id FROM storage.buckets WHERE name = 'products';
  
  IF test_bucket_id IS NULL THEN
    RAISE NOTICE 'Products bucket does not exist, creating it...';
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('products', 'products', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO test_bucket_id;
  END IF;
  
  RAISE NOTICE 'Products bucket ID: %', test_bucket_id;
  
  -- Try to insert a test record
  BEGIN
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES (test_bucket_id, 'test.txt', auth.uid(), '{"test": true}'::jsonb);
    RAISE NOTICE 'Test insert successful!';
    
    -- Clean up test record
    DELETE FROM storage.objects WHERE name = 'test.txt' AND bucket_id = test_bucket_id;
    RAISE NOTICE 'Test record cleaned up';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test insert failed: %', SQLERRM;
  END;
  
END $$;

-- 5. If everything above works, let's verify the bucket structure
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'products';

-- 6. Final permission check
SELECT 
  'authenticated' as role,
  has_table_privilege('authenticated', 'storage.objects', 'INSERT') as can_insert,
  has_table_privilege('authenticated', 'storage.objects', 'SELECT') as can_select,
  has_table_privilege('authenticated', 'storage.objects', 'UPDATE') as can_update,
  has_table_privilege('authenticated', 'storage.objects', 'DELETE') as can_delete
UNION ALL
SELECT 
  'public' as role,
  has_table_privilege('public', 'storage.objects', 'INSERT') as can_insert,
  has_table_privilege('public', 'storage.objects', 'SELECT') as can_select,
  has_table_privilege('public', 'storage.objects', 'UPDATE') as can_update,
  has_table_privilege('public', 'storage.objects', 'DELETE') as can_delete; 