-- Database Schema Extensions for Artist Dashboard
-- Run these after the initial database.sql setup

-- Enhanced galleries table for admin management and public display
CREATE TABLE IF NOT EXISTS galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE, -- for URLs like /where-to-find/galeria-xyz

  -- Full Address Fields
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL,
  country_code CHAR(2), -- for flag display
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Contact Information
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,

  -- Business Details
  opening_hours JSONB, -- {"monday": "9:00-18:00", "tuesday": "9:00-18:00", ...}
  commission_rate DECIMAL(5,2),
  payment_terms TEXT,
  shipping_arrangements TEXT,
  insurance_provider TEXT,

  -- Display & Media
  gallery_photo TEXT, -- Supabase storage URL
  description_pt TEXT,
  description_en TEXT,

  -- Relationship Management
  relationship_status TEXT CHECK (relationship_status IN ('active', 'inactive', 'prospective')) DEFAULT 'active',
  first_partnership_date DATE,
  contract_expiry_date DATE,

  -- Public Display Settings
  is_active BOOLEAN DEFAULT true,
  show_on_website BOOLEAN DEFAULT true, -- for Where to Find page
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create slug generation function
CREATE OR REPLACE FUNCTION generate_gallery_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '\s+', '-', 'g');

    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM galleries WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      NEW.slug := NEW.slug || '-' || floor(random() * 1000)::text;
    END LOOP;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gallery slug generation
DROP TRIGGER IF EXISTS gallery_slug_trigger ON galleries;
CREATE TRIGGER gallery_slug_trigger
  BEFORE INSERT OR UPDATE ON galleries
  FOR EACH ROW
  EXECUTE FUNCTION generate_gallery_slug();

-- Artwork Location Tracking
CREATE TABLE IF NOT EXISTS artwork_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  gallery_id UUID REFERENCES galleries(id),
  location_type TEXT NOT NULL CHECK (location_type IN ('gallery', 'studio', 'collector', 'exhibition', 'storage', 'transit')),

  -- Movement Tracking
  date_moved TIMESTAMPTZ DEFAULT NOW(),
  expected_return_date DATE,
  shipping_tracking_number TEXT,
  condition_on_arrival TEXT,

  -- Current Status
  is_current BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,
  created_by UUID, -- artist user ID

  -- Ensure only one current location per artwork
  CONSTRAINT unique_current_location UNIQUE (artwork_id, is_current) DEFERRABLE INITIALLY DEFERRED
);

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_artwork_locations_current ON artwork_locations(artwork_id, is_current);
CREATE INDEX IF NOT EXISTS idx_artwork_locations_gallery ON artwork_locations(gallery_id);

-- Function to update artwork location
CREATE OR REPLACE FUNCTION update_artwork_location(
  p_artwork_id UUID,
  p_location_type TEXT,
  p_gallery_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_expected_return_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_location_id UUID;
BEGIN
  -- Mark current location as not current
  UPDATE artwork_locations
  SET is_current = false
  WHERE artwork_id = p_artwork_id AND is_current = true;

  -- Insert new location
  INSERT INTO artwork_locations (
    artwork_id, gallery_id, location_type, notes, expected_return_date, is_current
  ) VALUES (
    p_artwork_id, p_gallery_id, p_location_type, p_notes, p_expected_return_date, true
  ) RETURNING id INTO v_location_id;

  RETURN v_location_id;
END;
$$ LANGUAGE plpgsql;

-- Sales Records with Enhanced Tracking
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id),
  gallery_id UUID REFERENCES galleries(id), -- NULL for direct sales

  -- Sale Details
  sale_date DATE NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2), -- can override gallery default
  commission_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2), -- after commission
  currency TEXT DEFAULT 'BRL' CHECK (currency IN ('BRL', 'USD', 'EUR')),

  -- Buyer Information
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_country TEXT,
  buyer_address JSONB,

  -- Payment & Documentation
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  invoice_number TEXT,
  certificate_of_authenticity_sent BOOLEAN DEFAULT false,

  -- Metadata
  sale_type TEXT DEFAULT 'gallery' CHECK (sale_type IN ('gallery', 'direct', 'online')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sales queries
CREATE INDEX IF NOT EXISTS idx_sales_artwork ON sales(artwork_id);
CREATE INDEX IF NOT EXISTS idx_sales_gallery ON sales(gallery_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

-- Function to calculate commission automatically
CREATE OR REPLACE FUNCTION calculate_sale_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- If commission rate not provided, use gallery default
  IF NEW.commission_rate IS NULL AND NEW.gallery_id IS NOT NULL THEN
    SELECT commission_rate INTO NEW.commission_rate
    FROM galleries
    WHERE id = NEW.gallery_id;
  END IF;

  -- Calculate commission amount
  IF NEW.commission_rate IS NOT NULL THEN
    NEW.commission_amount := NEW.sale_price * (NEW.commission_rate / 100);
    NEW.net_amount := NEW.sale_price - NEW.commission_amount;
  ELSE
    NEW.commission_amount := 0;
    NEW.net_amount := NEW.sale_price;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sale commission calculation
DROP TRIGGER IF EXISTS sale_commission_trigger ON sales;
CREATE TRIGGER sale_commission_trigger
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sale_commission();

-- Private Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL, -- artist user ID

  -- Content
  title TEXT,
  content TEXT NOT NULL,
  excerpt TEXT, -- auto-generated or manual

  -- Metadata
  mood TEXT, -- happy, contemplative, frustrated, inspired, etc.
  weather TEXT, -- auto-fetched or manual
  location TEXT, -- studio, gallery, travel location
  inspiration_source TEXT,

  -- Artwork Connections
  artwork_references UUID[], -- array of artwork IDs mentioned

  -- Publication Settings
  is_public BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  blog_post_id UUID REFERENCES blog_posts(id), -- if converted to blog post

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for journal queries
CREATE INDEX IF NOT EXISTS idx_journal_author ON journal_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_journal_public ON journal_entries(is_public);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at);

-- Function to auto-generate excerpt
CREATE OR REPLACE FUNCTION generate_journal_excerpt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.excerpt IS NULL OR NEW.excerpt = '' THEN
    NEW.excerpt := left(regexp_replace(NEW.content, '<[^>]*>', '', 'g'), 200) || '...';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for journal excerpt generation
DROP TRIGGER IF EXISTS journal_excerpt_trigger ON journal_entries;
CREATE TRIGGER journal_excerpt_trigger
  BEFORE INSERT OR UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION generate_journal_excerpt();

-- Gallery Performance Metrics (Auto-calculated)
CREATE TABLE IF NOT EXISTS gallery_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id),

  -- Time Period
  period_start DATE,
  period_end DATE,

  -- Performance Data
  total_artworks_displayed INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  average_sale_price DECIMAL(10,2),
  conversion_rate DECIMAL(5,2), -- percentage sold vs displayed
  average_days_to_sale INTEGER,

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(gallery_id, period_start, period_end)
);

-- Function to calculate gallery metrics
CREATE OR REPLACE FUNCTION calculate_gallery_metrics(
  p_gallery_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS VOID AS $$
DECLARE
  v_total_displayed INTEGER;
  v_total_sold INTEGER;
  v_total_revenue DECIMAL(10,2);
  v_total_commission DECIMAL(10,2);
  v_avg_sale_price DECIMAL(10,2);
  v_conversion_rate DECIMAL(5,2);
  v_avg_days_to_sale INTEGER;
BEGIN
  -- Calculate metrics
  SELECT
    COUNT(DISTINCT al.artwork_id),
    COUNT(DISTINCT s.artwork_id),
    COALESCE(SUM(s.sale_price), 0),
    COALESCE(SUM(s.commission_amount), 0),
    COALESCE(AVG(s.sale_price), 0),
    CASE
      WHEN COUNT(DISTINCT al.artwork_id) > 0
      THEN (COUNT(DISTINCT s.artwork_id)::DECIMAL / COUNT(DISTINCT al.artwork_id)) * 100
      ELSE 0
    END,
    COALESCE(AVG(s.sale_date - al.date_moved::DATE), 0)
  INTO
    v_total_displayed,
    v_total_sold,
    v_total_revenue,
    v_total_commission,
    v_avg_sale_price,
    v_conversion_rate,
    v_avg_days_to_sale
  FROM artwork_locations al
  LEFT JOIN sales s ON al.artwork_id = s.artwork_id
    AND s.sale_date BETWEEN p_start_date AND p_end_date
    AND s.gallery_id = p_gallery_id
  WHERE al.gallery_id = p_gallery_id
    AND al.date_moved::DATE <= p_end_date;

  -- Insert or update metrics
  INSERT INTO gallery_metrics (
    gallery_id, period_start, period_end,
    total_artworks_displayed, total_sold, total_revenue, total_commission,
    average_sale_price, conversion_rate, average_days_to_sale
  ) VALUES (
    p_gallery_id, p_start_date, p_end_date,
    v_total_displayed, v_total_sold, v_total_revenue, v_total_commission,
    v_avg_sale_price, v_conversion_rate, v_avg_days_to_sale
  )
  ON CONFLICT (gallery_id, period_start, period_end)
  DO UPDATE SET
    total_artworks_displayed = EXCLUDED.total_artworks_displayed,
    total_sold = EXCLUDED.total_sold,
    total_revenue = EXCLUDED.total_revenue,
    total_commission = EXCLUDED.total_commission,
    average_sale_price = EXCLUDED.average_sale_price,
    conversion_rate = EXCLUDED.conversion_rate,
    average_days_to_sale = EXCLUDED.average_days_to_sale,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for security

-- Galleries RLS
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for active galleries" ON galleries
  FOR SELECT
  USING (is_active = true AND show_on_website = true);

CREATE POLICY "Allow authenticated users full access" ON galleries
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Artwork locations RLS
ALTER TABLE artwork_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access" ON artwork_locations
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Sales RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access" ON sales
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Journal entries RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for published entries" ON journal_entries
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Allow authenticated users full access" ON journal_entries
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Gallery metrics RLS
ALTER TABLE gallery_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access" ON gallery_metrics
  FOR ALL
  USING (auth.role() = 'authenticated');