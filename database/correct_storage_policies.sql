-- Correct Supabase Storage RLS policies for the products bucket
-- These policies follow the official Supabase documentation

-- 1. Policy for INSERT (uploading files) - Allow authenticated users to upload to products bucket
CREATE POLICY "Allow authenticated uploads to products bucket"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'products'
);

-- 2. Policy for SELECT (viewing files) - Allow public to view all product images
CREATE POLICY "Allow public to view product images"
ON storage.objects
FOR SELECT 
TO public
USING (
  bucket_id = 'products'
);

-- 3. Policy for UPDATE (overwriting files) - Allow authenticated users to update files
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

-- 4. Policy for DELETE (removing files) - Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from products bucket"
ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'products'
);

-- 5. Optional: More restrictive policy that only allows uploads to valid category folders
-- Uncomment this if you want to restrict uploads to only existing category slugs
/*
CREATE POLICY "Allow authenticated uploads to valid category folders"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  (storage.foldername(name))[1] IN (
    SELECT slug FROM public.categories WHERE is_active = true
  )
);
*/

-- 6. Check if policies were created successfully
-- SELECT * FROM storage.policies WHERE tablename = 'objects';

-- 7. If you need to drop policies later, use these commands:
-- DROP POLICY IF EXISTS "Allow authenticated uploads to products bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public to view product images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated updates to products bucket" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated deletes from products bucket" ON storage.objects; 