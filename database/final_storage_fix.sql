-- Final comprehensive storage fix for Supabase
-- Running as postgres superuser - this should work!

-- 1. First, let's check if the storage schema and objects table exist
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'storage';

-- 2. Check if the products bucket exists in storage.buckets
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'products';

-- 3. Check current RLS status on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 4. Check existing policies on storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 5. Create the products bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 6. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from products bucket" ON storage.objects;

-- 7. Create the correct policies
CREATE POLICY "Allow authenticated uploads to products bucket"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'products'
);

CREATE POLICY "Allow public to view product images"
ON storage.objects
FOR SELECT 
TO public
USING (
  bucket_id = 'products'
);

CREATE POLICY "Allow authenticated updates to products bucket"
ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'products'
)
WITH CHECK (
  bucket_id = 'products'
);

CREATE POLICY "Allow authenticated deletes from products bucket"
ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'products'
);

-- 8. Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO public;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO public;

-- 9. Verify the policies were created
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 10. Test if you can insert into storage.objects (should work as postgres)
-- This will help verify the setup is working
SELECT 
  has_table_privilege('storage.objects', 'INSERT') as can_insert,
  has_table_privilege('storage.objects', 'SELECT') as can_select,
  has_table_privilege('storage.objects', 'UPDATE') as can_update,
  has_table_privilege('storage.objects', 'DELETE') as can_delete; 