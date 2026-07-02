-- Numeric dimensions for AR true-scale rendering.
-- Convention (confirmed with the artist): first number in the existing
-- dimensions text is HEIGHT, second is WIDTH, both in cm.
-- The dimensions TEXT column stays authoritative for display and slugs.

ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS width_cm  NUMERIC(6,1);

COMMENT ON COLUMN artworks.height_cm IS 'Physical height in cm (H x W convention). Drives AR true scale.';
COMMENT ON COLUMN artworks.width_cm  IS 'Physical width in cm (H x W convention). Drives AR true scale.';

-- Backfill from the free-text dimensions column. Rows that do not parse to
-- exactly two plausible numbers stay NULL (fixed manually in the admin form).
WITH parsed AS (
  SELECT id,
         (regexp_match(replace(dimensions, ',', '.'),
            '(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)'))[1]::numeric AS h,
         (regexp_match(replace(dimensions, ',', '.'),
            '(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)'))[2]::numeric AS w
  FROM artworks
)
UPDATE artworks a
SET height_cm = p.h,
    width_cm  = p.w
FROM parsed p
WHERE a.id = p.id
  AND p.h BETWEEN 1 AND 999
  AND p.w BETWEEN 1 AND 999
  AND a.height_cm IS NULL
  AND a.width_cm  IS NULL;

-- Review leftovers (fix via admin edit form):
SELECT id, title_en, dimensions
FROM artworks
WHERE height_cm IS NULL OR width_cm IS NULL
ORDER BY year DESC;
