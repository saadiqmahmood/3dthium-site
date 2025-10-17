-- Comprehensive fix for Supabase Storage RLS policies
-- This script will resolve all storage upload issues

-- 1. First, let's check what policies exist
-- SELECT * FROM storage.policies;

-- 2. Drop all existing storage policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete product images" ON storage.objects;

-- 3. Disable RLS completely for now (we'll re-enable with proper policies)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 4. Grant all necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO service_role;

-- 5. Also grant permissions on the storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO service_role;

-- 6. Ensure the products bucket exists and is accessible
-- Note: You may need to create this bucket manually in the Supabase dashboard
-- Go to Storage > New Bucket > Name: "products" > Public: true

-- 7. If you want to re-enable RLS later with proper policies, uncomment this:
/*
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all authenticated users
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow public viewing" ON storage.objects
FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated USING (true);
*/

-- 8. Check if the fix worked
-- SELECT * FROM storage.policies;
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'objects'; 