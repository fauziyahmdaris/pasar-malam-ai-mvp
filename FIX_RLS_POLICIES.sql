-- FIX RLS POLICIES - Run this in Supabase SQL Editor
-- This will fix the "Failed to load user data" error

-- ==================================================
-- STEP 1: DISABLE ALL PROBLEMATIC POLICIES
-- ==================================================

-- Drop all existing policies on user_roles table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role during signup" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for all users" ON user_roles;

-- ==================================================
-- STEP 2: TEMPORARILY DISABLE RLS (FOR TESTING)
-- ==================================================

-- This will allow all authenticated users to access user_roles
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- STEP 3: FIX PROFILES TABLE RLS (IF NEEDED)
-- ==================================================

-- Drop any problematic policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Disable RLS on profiles temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- STEP 4: CREATE SIMPLE, WORKING POLICIES
-- ==================================================

-- Re-enable RLS with SIMPLE policies that won't cause recursion
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow ALL authenticated users to read user_roles
-- (This is safe because it only contains role assignments, no sensitive data)
CREATE POLICY "Allow authenticated users to read all roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own role during signup
CREATE POLICY "Allow users to insert own role"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to read all profiles (needed for displaying seller names, etc.)
CREATE POLICY "Allow authenticated users to read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ==================================================
-- DONE! Your login should work now!
-- ==================================================

-- To verify, run this query to see your roles:
-- SELECT * FROM user_roles WHERE user_id = auth.uid();
