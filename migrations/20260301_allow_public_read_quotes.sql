-- Restore public read access to quotes table
-- This was removed by 20251125_fix_all_rls_authenticated.sql
CREATE POLICY "Allow public read access to quotes"
  ON quotes FOR SELECT USING (true);
