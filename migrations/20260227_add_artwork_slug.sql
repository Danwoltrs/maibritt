-- Add slug column to artworks
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill existing artworks with generated slugs
UPDATE artworks
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          concat(
            title_en, '-',
            replace(replace(replace(dimensions, ' ', ''), ',', ''), '.', ''),
            '-', year::text
          ),
          '[^a-zA-Z0-9\s\-x]', '', 'g'
        ),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    ),
    '^-|-$', '', 'g'
  )
)
WHERE slug IS NULL;

-- Handle duplicate slugs by appending row number
WITH duplicates AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM artworks
  WHERE slug IS NOT NULL
)
UPDATE artworks
SET slug = duplicates.slug || '-' || duplicates.rn
FROM duplicates
WHERE artworks.id = duplicates.id AND duplicates.rn > 1;

-- Add NOT NULL constraint and unique index
ALTER TABLE artworks ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_artworks_slug ON artworks(slug);
