-- Clean up duplicate and conflicting storage policies
-- This will remove all the duplicate policies and keep only the essential ones

-- 1. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to custom-orders" ON storage.objects;
DROP POLICY IF EXISTS "test_upload_policy" ON storage.objects;

-- 2. Create clean, simple policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow public viewing"
ON storage.objects
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE 
TO authenticated
USING (true);

-- 3. Grant all necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO public;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO public;

-- 4. Verify the cleanup
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 5. Test permissions
SELECT 
  has_table_privilege('authenticated', 'storage.objects', 'INSERT') as authenticated_can_insert,
  has_table_privilege('public', 'storage.objects', 'SELECT') as public_can_select;

-- 6. If you still get RLS errors, uncomment this line to completely disable RLS:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY; 