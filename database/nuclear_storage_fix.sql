-- Nuclear Option: Completely disable RLS on storage.objects
-- This will bypass ALL policy issues and allow uploads to work

-- 1. First, let's see what policies exist
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 2. Drop ALL existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from products bucket" ON storage.objects;
DROP POLICY IF EXISTS "test_upload_policy" ON storage.objects;

-- 3. Disable RLS completely on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 4. Grant ALL permissions to everyone (for testing)
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO public;
GRANT ALL ON storage.objects TO service_role;

-- 5. Also grant schema usage
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO public;
GRANT USAGE ON SCHEMA storage TO service_role;

-- 6. Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 7. Verify permissions
SELECT 
  has_table_privilege('storage.objects', 'INSERT') as can_insert,
  has_table_privilege('storage.objects', 'SELECT') as can_select,
  has_table_privilege('storage.objects', 'UPDATE') as can_update,
  has_table_privilege('storage.objects', 'DELETE') as can_delete;

-- 8. Test insert capability
-- This should work now that RLS is disabled
SELECT 
  has_table_privilege('authenticated', 'storage.objects', 'INSERT') as authenticated_can_insert,
  has_table_privilege('anon', 'storage.objects', 'INSERT') as anon_can_insert,
  has_table_privilege('public', 'storage.objects', 'INSERT') as public_can_insert;

-- 9. If you want to re-enable RLS later with proper policies, run:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- Then create the proper policies from the other script 