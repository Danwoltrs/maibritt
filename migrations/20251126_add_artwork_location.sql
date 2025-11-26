-- Add location tracking fields to artworks table
-- This allows tracking where each artwork is physically located

-- Add location_type column for the type of location
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN ('studio', 'gallery', 'exhibition', 'sold', 'private'));

-- Add location_id column to reference specific gallery or exhibition
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS location_id UUID;

-- Add location_notes for additional information
ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS location_notes TEXT;

-- Create index for efficient querying by location
CREATE INDEX IF NOT EXISTS idx_artworks_location_type ON artworks(location_type);
CREATE INDEX IF NOT EXISTS idx_artworks_location_id ON artworks(location_id);

-- Add comment for documentation
COMMENT ON COLUMN artworks.location_type IS 'Current location type: studio, gallery, exhibition, sold, or private collection';
COMMENT ON COLUMN artworks.location_id IS 'Reference to galleries.id or exhibitions.id depending on location_type';
COMMENT ON COLUMN artworks.location_notes IS 'Additional notes about the artwork location';

-- Set default location_type to studio for existing artworks
UPDATE artworks SET location_type = 'studio' WHERE location_type IS NULL;
