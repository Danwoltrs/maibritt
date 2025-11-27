-- Add detailed address fields to exhibitions table
-- Replace single 'location' field with structured address

ALTER TABLE exhibitions
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS street_number TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Keep legacy 'location' field for backward compatibility but it will no longer be used
-- The frontend will construct location from the new fields

-- Add comment explaining the fields
COMMENT ON COLUMN exhibitions.street IS 'Street name (e.g., Rua Augusta)';
COMMENT ON COLUMN exhibitions.street_number IS 'Street number (e.g., 1234)';
COMMENT ON COLUMN exhibitions.neighborhood IS 'Neighborhood/District (e.g., Consolação)';
COMMENT ON COLUMN exhibitions.zip_code IS 'Postal/ZIP code (e.g., 01310-100)';
COMMENT ON COLUMN exhibitions.city IS 'City name (e.g., São Paulo)';
COMMENT ON COLUMN exhibitions.state IS 'State/Province (e.g., SP)';
COMMENT ON COLUMN exhibitions.country IS 'Country (e.g., Brazil)';
