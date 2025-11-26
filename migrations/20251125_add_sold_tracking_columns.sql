-- Add sold tracking columns to artworks table
-- These track when an artwork is sold and buyer information

ALTER TABLE artworks ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS sold_price NUMERIC;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS sold_currency TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS sold_date TIMESTAMPTZ;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS buyer_phone TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS buyer_address TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS buyer_city TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS buyer_state TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS buyer_country TEXT;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS buyer_zip_code TEXT;

-- Create index for sold artworks queries
CREATE INDEX IF NOT EXISTS idx_artworks_is_sold ON artworks(is_sold);
CREATE INDEX IF NOT EXISTS idx_artworks_sold_date ON artworks(sold_date);
