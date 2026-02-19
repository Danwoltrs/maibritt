-- Add category column to art_series for organizing series by type (Paintings, Sculptures, etc.)
ALTER TABLE art_series ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;
COMMENT ON COLUMN art_series.category IS 'Art category (e.g., Paintings, Sculptures)';
