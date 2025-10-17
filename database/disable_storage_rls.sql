-- Quick fix: Disable RLS on storage bucket
-- This is simpler but less secure - use only for testing

-- Disable RLS on the storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;

-- Grant select permissions to public (for viewing images)
GRANT SELECT ON storage.objects TO public;

-- If you want to re-enable RLS later, run:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 