-- Create galleries table for Mai-Britt Wolthers portfolio
-- This table manages gallery partnerships and exhibition locations

CREATE TABLE IF NOT EXISTS galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  
  -- Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL,
  country_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact Information
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  
  -- Business Terms
  opening_hours JSONB, -- Store as JSON: {"monday": "10:00-18:00", "tuesday": "closed", etc.}
  commission_rate DECIMAL(5, 2), -- Percentage (e.g., 25.50 for 25.5%)
  payment_terms TEXT,
  shipping_arrangements TEXT,
  insurance_provider TEXT,
  
  -- Display Information
  gallery_photo TEXT, -- URL to gallery image
  description_pt TEXT,
  description_en TEXT,
  
  -- Relationship Management
  relationship_status TEXT NOT NULL DEFAULT 'prospective' CHECK (relationship_status IN ('active', 'inactive', 'prospective')),
  first_partnership_date DATE,
  contract_expiry_date DATE,
  
  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_on_website BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Internal Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_galleries_slug ON galleries(slug);
CREATE INDEX IF NOT EXISTS idx_galleries_country ON galleries(country);
CREATE INDEX IF NOT EXISTS idx_galleries_active ON galleries(is_active);
CREATE INDEX IF NOT EXISTS idx_galleries_website_display ON galleries(show_on_website, is_active);
CREATE INDEX IF NOT EXISTS idx_galleries_featured ON galleries(featured);
CREATE INDEX IF NOT EXISTS idx_galleries_display_order ON galleries(display_order);
CREATE INDEX IF NOT EXISTS idx_galleries_relationship_status ON galleries(relationship_status);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_galleries_updated_at 
  BEFORE UPDATE ON galleries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO galleries (
  name, slug, address_line1, city, country, country_code,
  contact_person, email, website, relationship_status,
  is_active, show_on_website, featured, display_order
) VALUES
(
  'Galeria Eduardo Fernandes',
  'galeria-eduardo-fernandes',
  'Rua Estados Unidos, 1456',
  'São Paulo',
  'Brazil',
  'BR',
  'Eduardo Fernandes',
  'contato@galeriaeduardofernandes.com.br',
  'https://galeriaeduardofernandes.com.br',
  'active',
  true,
  true,
  true,
  1
),
(
  'Charlottenborg Exhibition Hall',
  'charlottenborg-exhibition-hall',
  'Nyhavn 2',
  'Copenhagen',
  'Denmark',
  'DK',
  'Curator',
  'info@charlottenborg.dk',
  'https://charlottenborg.dk',
  'active',
  true,
  true,
  false,
  2
),
(
  'Lamb-arts Gallery',
  'lamb-arts-gallery',
  '123 Art Street',
  'London',
  'United Kingdom',
  'UK',
  'Gallery Director',
  'info@lamb-arts.com',
  'https://lamb-arts.com',
  'inactive',
  true,
  true,
  false,
  3
);

-- Grant appropriate permissions
-- These should be adjusted based on your RLS policies
GRANT ALL ON galleries TO authenticated;
GRANT SELECT ON galleries TO anon;

COMMENT ON TABLE galleries IS 'Gallery partnerships and exhibition locations for Mai-Britt Wolthers portfolio';
COMMENT ON COLUMN galleries.slug IS 'URL-friendly identifier derived from gallery name';
COMMENT ON COLUMN galleries.opening_hours IS 'JSON object with day-of-week keys and time range values';
COMMENT ON COLUMN galleries.commission_rate IS 'Commission percentage for sales through this gallery';
COMMENT ON COLUMN galleries.relationship_status IS 'Current partnership status: active, inactive, or prospective';
COMMENT ON COLUMN galleries.display_order IS 'Order for displaying galleries on public pages (lower numbers first)';
COMMENT ON COLUMN galleries.featured IS 'Whether to prominently display this gallery on the website';