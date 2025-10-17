-- Storage Diagnostic Script
-- Let's figure out exactly what's happening with your storage policies

-- 1. Check if storage.objects table exists and its structure
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'storage' AND table_name = 'objects';

-- 2. Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. List ALL policies on storage.objects
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 4. Check if the products bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'products';

-- 5. Check your current role and permissions
SELECT 
  current_user,
  current_setting('role'),
  session_user;

-- 6. Test if you can actually insert into storage.objects
-- This should work as postgres superuser
SELECT 
  has_table_privilege('storage.objects', 'INSERT') as can_insert,
  has_table_privilege('storage.objects', 'SELECT') as can_select,
  has_table_privilege('storage.objects', 'UPDATE') as can_update,
  has_table_privilege('storage.objects', 'DELETE') as can_delete;

-- 7. Check if there are any triggers or constraints blocking inserts
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'objects' AND event_object_schema = 'storage';

-- 8. Let's see what happens when we try to create a test policy
-- This will help identify any syntax issues
DO $$
BEGIN
  RAISE NOTICE 'Testing policy creation...';
  
  -- Try to create a simple test policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'test_upload_policy' 
    AND tablename = 'objects' 
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "test_upload_policy"
    ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);
    
    RAISE NOTICE 'Test policy created successfully!';
  ELSE
    RAISE NOTICE 'Test policy already exists';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating test policy: %', SQLERRM;
END $$;

-- 9. Check if the test policy was created
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname; 