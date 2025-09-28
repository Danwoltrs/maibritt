-- Mai-Britt Wolthers Artist Portfolio Database Schema
-- Execute these SQL commands in your Supabase SQL editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE artwork_category AS ENUM ('painting', 'sculpture', 'engraving', 'video', 'mixed-media');
CREATE TYPE currency_type AS ENUM ('BRL', 'USD', 'EUR');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE exhibition_type AS ENUM ('solo', 'group', 'residency');
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE sale_action AS ENUM ('listed', 'reserved', 'sold', 'unlisted');

-- Art series table
CREATE TABLE art_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  year INTEGER NOT NULL,
  cover_image TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_seasonal BOOLEAN DEFAULT false,
  season_start DATE,
  season_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artworks table
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  year INTEGER NOT NULL,
  medium_pt TEXT NOT NULL,
  medium_en TEXT NOT NULL,
  dimensions TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  category artwork_category NOT NULL,
  series_id UUID REFERENCES art_series(id) ON DELETE SET NULL,
  images JSONB NOT NULL DEFAULT '[]',
  for_sale BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  currency currency_type DEFAULT 'BRL',
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_price CHECK (price IS NULL OR price > 0),
  CONSTRAINT price_with_currency CHECK ((price IS NULL AND currency IS NULL) OR (price IS NOT NULL AND currency IS NOT NULL))
);

-- Exhibitions table
CREATE TABLE exhibitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  location TEXT NOT NULL,
  year INTEGER NOT NULL,
  type exhibition_type NOT NULL,
  description TEXT,
  image TEXT,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table (for scraped content)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  author TEXT,
  published_date DATE,
  sentiment sentiment_type,
  verified BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency currency_type NOT NULL,
  stripe_payment_id TEXT,
  status order_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Sale history table (for tracking artwork sale actions)
CREATE TABLE sale_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  action sale_action NOT NULL,
  price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_artworks_category ON artworks(category);
CREATE INDEX idx_artworks_year ON artworks(year);
CREATE INDEX idx_artworks_for_sale ON artworks(for_sale, is_available);
CREATE INDEX idx_artworks_series ON artworks(series_id);
CREATE INDEX idx_artworks_display_order ON artworks(display_order);
CREATE INDEX idx_artworks_featured ON artworks(featured);
CREATE INDEX idx_artworks_created_at ON artworks(created_at);

CREATE INDEX idx_series_active ON art_series(is_active);
CREATE INDEX idx_series_seasonal ON art_series(is_seasonal);
CREATE INDEX idx_series_display_order ON art_series(display_order);

CREATE INDEX idx_exhibitions_year ON exhibitions(year);
CREATE INDEX idx_exhibitions_type ON exhibitions(type);
CREATE INDEX idx_exhibitions_featured ON exhibitions(featured);

CREATE INDEX idx_reviews_verified ON reviews(verified);
CREATE INDEX idx_reviews_published_date ON reviews(published_date);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artworks_updated_at BEFORE UPDATE ON artworks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_art_series_updated_at BEFORE UPDATE ON art_series FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exhibitions_updated_at BEFORE UPDATE ON exhibitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE art_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_history ENABLE ROW LEVEL SECURITY;

-- Public read access for main content
CREATE POLICY "Allow public read access to artworks" ON artworks FOR SELECT USING (true);
CREATE POLICY "Allow public read access to art_series" ON art_series FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to exhibitions" ON exhibitions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to verified reviews" ON reviews FOR SELECT USING (verified = true);

-- Admin full access (you'll need to set up authentication and admin role)
CREATE POLICY "Allow admin full access to artworks" ON artworks FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Allow admin full access to art_series" ON art_series FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Allow admin full access to exhibitions" ON exhibitions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Allow admin full access to reviews" ON reviews FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Allow admin full access to orders" ON orders FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Allow admin full access to sale_history" ON sale_history FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Storage buckets (run these in the Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exhibitions', 'exhibitions', true);

-- Storage policies
-- CREATE POLICY "Allow public read access to artwork images" ON storage.objects FOR SELECT USING (bucket_id = 'artworks');
-- CREATE POLICY "Allow admin upload to artwork images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'artworks' AND auth.jwt() ->> 'role' = 'admin');
-- CREATE POLICY "Allow admin update artwork images" ON storage.objects FOR UPDATE USING (bucket_id = 'artworks' AND auth.jwt() ->> 'role' = 'admin');
-- CREATE POLICY "Allow admin delete artwork images" ON storage.objects FOR DELETE USING (bucket_id = 'artworks' AND auth.jwt() ->> 'role' = 'admin');