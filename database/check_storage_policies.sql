-- Check existing storage policies using the correct system catalog
-- This works with all Supabase versions

-- Method 1: Check policies on storage.objects table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Method 2: Check if RLS is enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Method 3: Check all policies in the storage schema
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage';

-- Method 4: Check if you have access to create policies
SELECT 
  has_table_privilege('storage.objects', 'INSERT') as can_insert,
  has_table_privilege('storage.objects', 'SELECT') as can_select,
  has_table_privilege('storage.objects', 'UPDATE') as can_update,
  has_table_privilege('storage.objects', 'DELETE') as can_delete;

-- Method 5: Check current user and role
SELECT 
  current_user,
  current_setting('role'),
  session_user; 