-- Fix RLS policies for all tables
-- The current policies check for role='admin' but users have role='authenticated'

-- ============ ARTWORKS ============
DROP POLICY IF EXISTS "Allow admin full access to artworks" ON artworks;
CREATE POLICY "Allow authenticated users full access to artworks"
ON artworks FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ============ ART_SERIES ============
DROP POLICY IF EXISTS "Allow admin full access to art_series" ON art_series;
CREATE POLICY "Allow authenticated users full access to art_series"
ON art_series FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ============ EXHIBITIONS ============
DROP POLICY IF EXISTS "Allow admin full access to exhibitions" ON exhibitions;
CREATE POLICY "Allow authenticated users full access to exhibitions"
ON exhibitions FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ============ GALLERIES ============
DROP POLICY IF EXISTS "Allow admin full access to galleries" ON galleries;
CREATE POLICY "Allow authenticated users full access to galleries"
ON galleries FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ============ QUOTES ============
DROP POLICY IF EXISTS "Allow admin full access to quotes" ON quotes;
CREATE POLICY "Allow authenticated users full access to quotes"
ON quotes FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ============ BLOG_POSTS ============
DROP POLICY IF EXISTS "Allow admin full access to blog posts" ON blog_posts;
CREATE POLICY "Allow authenticated users full access to blog_posts"
ON blog_posts FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ============ SITE_SETTINGS ============
DROP POLICY IF EXISTS "Allow admin full access to site_settings" ON site_settings;
CREATE POLICY "Allow authenticated users full access to site_settings"
ON site_settings FOR ALL TO authenticated
USING (true) WITH CHECK (true);
