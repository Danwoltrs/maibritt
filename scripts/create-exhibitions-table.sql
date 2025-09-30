-- Create exhibitions table for Mai-Britt Wolthers portfolio
-- This table manages past and upcoming exhibitions

CREATE TABLE IF NOT EXISTS exhibitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  location TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('solo', 'group', 'residency')),
  
  -- Content
  description TEXT,
  image TEXT, -- URL to exhibition image
  
  -- Display Settings
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exhibitions_year ON exhibitions(year);
CREATE INDEX IF NOT EXISTS idx_exhibitions_type ON exhibitions(type);
CREATE INDEX IF NOT EXISTS idx_exhibitions_featured ON exhibitions(featured);
CREATE INDEX IF NOT EXISTS idx_exhibitions_display_order ON exhibitions(display_order);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_exhibitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exhibitions_updated_at 
  BEFORE UPDATE ON exhibitions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_exhibitions_updated_at();

-- Enable Row Level Security
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;

-- Public read access for exhibitions
CREATE POLICY "Allow public read access to exhibitions" ON exhibitions FOR SELECT USING (true);

-- Admin full access (assuming admin role in JWT)
CREATE POLICY "Allow admin full access to exhibitions" ON exhibitions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert sample exhibitions data
INSERT INTO exhibitions (
  title, venue, location, year, type, description, image, featured, display_order
) VALUES
(
  'Mai-Britt Wolthers e a Cor Protagonista',
  'Pinacoteca Benedicto Calixto',
  'Santos, Brazil',
  2025,
  'solo',
  'Retrospectiva de 40 anos de carreira artística, com foco na cor como elemento narrativo principal.',
  'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=600',
  true,
  1
),
(
  'Fragmentos do Real',
  'Mothership Studio',
  'Brooklyn, NY',
  2022,
  'residency',
  'Residência artística que resultou em nova série de obras explorando a dualidade cultural.',
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600',
  true,
  2
),
(
  'Kunstnernes Efterårsudstilling',
  'Charlottenborg',
  'Copenhagen, Denmark',
  2021,
  'group',
  'Participação na prestigiosa exposição de outono dos artistas dinamarqueses.',
  'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600',
  false,
  3
),
(
  'Confluências',
  'Galeria Eduardo Fernandes',
  'São Paulo, Brazil',
  2019,
  'solo',
  'Exposição individual explorando os encontros entre culturas e paisagens.',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600',
  true,
  4
),
(
  'I''m Rosa',
  'Lamb-arts Gallery',
  'London, UK',
  2016,
  'group',
  'Exposição coletiva internacional com foco em artistas contemporâneos.',
  'https://images.unsplash.com/photo-1594736797933-d0a0ba2fe065?w=600',
  false,
  5
),
(
  'Equações',
  'Centro Cultural São Paulo',
  'São Paulo, Brazil',
  2014,
  'solo',
  'Exposição individual apresentando série de obras matemáticas e orgânicas.',
  'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=600',
  false,
  6
);

-- Grant appropriate permissions
GRANT ALL ON exhibitions TO authenticated;
GRANT SELECT ON exhibitions TO anon;

COMMENT ON TABLE exhibitions IS 'Exhibition history and upcoming shows for Mai-Britt Wolthers portfolio';
COMMENT ON COLUMN exhibitions.type IS 'Type of exhibition: solo, group, or residency';
COMMENT ON COLUMN exhibitions.featured IS 'Whether to prominently display this exhibition on the website';
COMMENT ON COLUMN exhibitions.display_order IS 'Order for displaying exhibitions (lower numbers first)';