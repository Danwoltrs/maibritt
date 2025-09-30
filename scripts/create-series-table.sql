-- Create art_series table for Mai-Britt Wolthers portfolio
-- This table manages artwork series and collections

CREATE TABLE IF NOT EXISTS art_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  year INTEGER NOT NULL,
  
  -- Display Settings
  cover_image TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Seasonal Series
  is_seasonal BOOLEAN DEFAULT false,
  season_start DATE,
  season_end DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_series_active ON art_series(is_active);
CREATE INDEX IF NOT EXISTS idx_series_seasonal ON art_series(is_seasonal);
CREATE INDEX IF NOT EXISTS idx_series_display_order ON art_series(display_order);
CREATE INDEX IF NOT EXISTS idx_series_year ON art_series(year);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_art_series_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_art_series_updated_at 
  BEFORE UPDATE ON art_series 
  FOR EACH ROW 
  EXECUTE FUNCTION update_art_series_updated_at();

-- Enable Row Level Security
ALTER TABLE art_series ENABLE ROW LEVEL SECURITY;

-- Public read access for active series
CREATE POLICY "Allow public read access to art_series" ON art_series FOR SELECT USING (is_active = true);

-- Admin full access (assuming admin role in JWT)
CREATE POLICY "Allow admin full access to art_series" ON art_series FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert sample series data
INSERT INTO art_series (
  name_pt, name_en, description_pt, description_en, year, cover_image, is_active, is_seasonal, display_order
) VALUES
(
  'Azul no Negro',
  'Blue in Black',
  'Expedição ao Rio Negro, Amazônia',
  'Rio Negro Expedition, Amazon',
  2015,
  'https://picsum.photos/600/400?random=1',
  true,
  false,
  1
),
(
  'Confluências',
  'Confluences',
  'Encontros de culturas e paisagens',
  'Cultural and landscape convergences',
  2019,
  'https://picsum.photos/600/400?random=2',
  true,
  false,
  2
),
(
  'Fragmentos do Real',
  'Fragments of Reality',
  'Residência artística em Brooklyn',
  'Artist residency in Brooklyn',
  2022,
  'https://picsum.photos/600/400?random=3',
  true,
  true,
  3
);

-- Grant appropriate permissions
GRANT ALL ON art_series TO authenticated;
GRANT SELECT ON art_series TO anon;

COMMENT ON TABLE art_series IS 'Art series and collections for Mai-Britt Wolthers portfolio';
COMMENT ON COLUMN art_series.is_seasonal IS 'Whether this series is seasonal/time-limited';
COMMENT ON COLUMN art_series.is_active IS 'Whether this series is active and visible in portfolio';
COMMENT ON COLUMN art_series.display_order IS 'Order for displaying series (lower numbers first)';