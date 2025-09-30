-- Add slug column to artworks table for SEO-friendly URLs
-- This should be run in Supabase SQL editor

-- Add slug column
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create index for slug (for fast lookups)
CREATE INDEX IF NOT EXISTS idx_artworks_slug ON artworks(slug);

-- Add unique constraint to prevent duplicate slugs
ALTER TABLE artworks 
ADD CONSTRAINT unique_artwork_slug UNIQUE (slug);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_artwork_slug(title_en TEXT, artwork_year INTEGER, artwork_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from English title and year
  base_slug := LOWER(TRIM(REGEXP_REPLACE(
    title_en || '-' || artwork_year::TEXT, 
    '[^a-zA-Z0-9\s\-]', '', 'g'
  )));
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\-+', '-', 'g');
  base_slug := TRIM(base_slug, '-');
  
  -- If base_slug is empty, use artwork ID
  IF base_slug IS NULL OR base_slug = '' THEN
    base_slug := 'artwork-' || artwork_id::TEXT;
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM artworks WHERE slug = final_slug AND id != artwork_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing artworks to have slugs
UPDATE artworks 
SET slug = generate_artwork_slug(title_en, year, id)
WHERE slug IS NULL OR slug = '';

-- Create trigger to automatically generate slug for new artworks
CREATE OR REPLACE FUNCTION auto_generate_artwork_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if slug is not provided or empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_artwork_slug(NEW.title_en, NEW.year, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_auto_generate_artwork_slug ON artworks;
CREATE TRIGGER trigger_auto_generate_artwork_slug
  BEFORE INSERT OR UPDATE ON artworks
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_artwork_slug();

-- Create function to manually regenerate slug for an artwork
CREATE OR REPLACE FUNCTION regenerate_artwork_slug(artwork_id UUID)
RETURNS TEXT AS $$
DECLARE
  artwork_title TEXT;
  artwork_year INTEGER;
  new_slug TEXT;
BEGIN
  SELECT title_en, year INTO artwork_title, artwork_year
  FROM artworks 
  WHERE id = artwork_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Artwork with ID % not found', artwork_id;
  END IF;
  
  new_slug := generate_artwork_slug(artwork_title, artwork_year, artwork_id);
  
  UPDATE artworks 
  SET slug = new_slug 
  WHERE id = artwork_id;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for slug access (same as other artwork policies)
-- Note: This assumes you already have RLS enabled on artworks table

-- Example usage:
-- SELECT regenerate_artwork_slug('your-artwork-uuid-here');

COMMENT ON COLUMN artworks.slug IS 'SEO-friendly URL slug generated from title and year';
COMMENT ON FUNCTION generate_artwork_slug IS 'Generates unique slug for artwork based on English title and year';
COMMENT ON FUNCTION regenerate_artwork_slug IS 'Manually regenerates slug for a specific artwork';