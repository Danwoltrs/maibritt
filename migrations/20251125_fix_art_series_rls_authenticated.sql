-- Fix RLS policy for art_series table
-- The current policy checks for role='admin' but users have role='authenticated'

-- Drop the existing admin-only policy that's blocking updates
DROP POLICY IF EXISTS "Allow admin full access to art_series" ON art_series;

-- Create a policy that allows authenticated users to perform all operations
CREATE POLICY "Allow authenticated users full access to art_series"
ON art_series
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- The public read policy already exists: "Allow public read access to art_series"
-- This allows unauthenticated visitors to view active series
