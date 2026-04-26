-- Canonical storage RLS policy for the 3dthium project.
-- Run this in Supabase SQL Editor to replace all previous storage "fixes".
--
-- Policy intent:
--   - Public (anon) can SELECT (read) from the 'products' bucket.
--   - Only the service_role can INSERT, UPDATE, DELETE (uploads come from
--     the admin API route which uses the service role client).
--   - No direct unauthenticated writes.

-- Step 1: Re-enable RLS (may have been disabled by nuclear_storage_fix.sql)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing storage policies to start clean
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END;
$$;

-- Step 3: Revoke any over-broad grants added by old scripts
REVOKE ALL ON storage.objects FROM anon;
REVOKE ALL ON storage.objects FROM public;

-- Step 4: Public read access to the products bucket
CREATE POLICY "products_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'products');

-- Step 5: Service role full access (used by the admin upload API)
-- service_role bypasses RLS by default — no policy needed for it.
-- This comment documents the intent.

-- Step 6: Authenticated (logged-in) users have no direct storage write access.
-- Uploads must go through /api/admin/upload-image which is auth-gated and
-- uses the service_role client server-side.

-- Verify: Run this query after applying to confirm policies.
-- SELECT policyname, cmd, roles FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';
