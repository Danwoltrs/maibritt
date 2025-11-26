-- Enable RLS on all tables that need public read access
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE art_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Artworks: Public can read all, admin can do everything
CREATE POLICY "Allow public read access to artworks" ON artworks
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to artworks" ON artworks
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Art Series: Public can read active series, admin can do everything
CREATE POLICY "Allow public read access to art_series" ON art_series
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to art_series" ON art_series
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Galleries: Public can read active galleries, admin can do everything
CREATE POLICY "Allow public read access to galleries" ON galleries
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to galleries" ON galleries
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Quotes: Public can read active quotes, admin can do everything
CREATE POLICY "Allow public read access to quotes" ON quotes
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to quotes" ON quotes
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Site Settings: Public can read all settings, admin can do everything
CREATE POLICY "Allow public read access to site_settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to site_settings" ON site_settings
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
