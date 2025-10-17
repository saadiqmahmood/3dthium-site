-- Fix Supabase Storage RLS policies for the products bucket
-- This script will allow authenticated users to upload images to the products bucket

-- First, let's check if the products bucket exists and create it if it doesn't
-- Note: You may need to create this bucket manually in the Supabase dashboard first

-- Option 1: Disable RLS on the products bucket (simpler, less secure)
-- Uncomment the line below if you want to disable RLS completely
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Option 2: Create proper RLS policies (more secure, recommended)
-- This allows authenticated users to upload to the products bucket

-- Policy for inserting (uploading) files
CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND 
  (storage.foldername(name))[1] IN (
    SELECT slug FROM public.categories WHERE is_active = true
  )
);

-- Policy for selecting (viewing) files
CREATE POLICY "Allow public to view product images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'products');

-- Policy for updating files (in case you need to replace images)
CREATE POLICY "Allow authenticated users to update product images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'products')
WITH CHECK (
  bucket_id = 'products' AND 
  (storage.foldername(name))[1] IN (
    SELECT slug FROM public.categories WHERE is_active = true
  )
);

-- Policy for deleting files
CREATE POLICY "Allow authenticated users to delete product images" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'products');

-- Alternative: If you want to be more restrictive and only allow admins
-- Uncomment the policies below and comment out the ones above

/*
-- Policy for inserting (uploading) files - Admin only
CREATE POLICY "Allow admins to upload product images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Policy for selecting (viewing) files - Public
CREATE POLICY "Allow public to view product images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'products');

-- Policy for updating files - Admin only
CREATE POLICY "Allow admins to update product images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'products' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);

-- Policy for deleting files - Admin only
CREATE POLICY "Allow admins to delete product images" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'products' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND is_admin = true
  )
);
*/

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO public;

-- If you want to check existing policies, run this:
-- SELECT * FROM storage.policies;

-- If you want to drop all policies and start fresh, run this:
-- DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public to view product images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON storage.objects; 