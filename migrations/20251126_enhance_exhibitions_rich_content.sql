-- Enhance exhibitions table with rich content support
-- This migration adds fields for blog-like content, multiple images, videos, and proper dates

-- Add bilingual title support
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS title_pt TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS title_en TEXT;

-- Add bilingual description support (rename existing to _en and add _pt)
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS description_pt TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Rich content body (like a blog post) - bilingual
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS content_pt TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Curator/press quotes
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS curator_name TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS curator_text_pt TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS curator_text_en TEXT;

-- Multiple images gallery (JSONB array of image URLs with captions)
-- Format: [{"url": "...", "caption_pt": "...", "caption_en": "...", "is_cover": true}]
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Videos (JSONB array of video URLs)
-- Format: [{"url": "youtube/vimeo url", "title_pt": "...", "title_en": "..."}]
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

-- Proper date fields for upcoming exhibitions
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS end_date DATE;

-- Opening event details
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS opening_date TIMESTAMPTZ;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS opening_details TEXT;

-- Flag to show as popup for upcoming exhibition
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS show_popup BOOLEAN DEFAULT false;

-- External links
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS catalog_url TEXT;

-- Slug for SEO-friendly URLs
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS slug TEXT;

-- Migrate existing data: copy title to title_en and description to description_en
UPDATE exhibitions SET title_en = title WHERE title_en IS NULL AND title IS NOT NULL;
UPDATE exhibitions SET description_en = description WHERE description_en IS NULL AND description IS NOT NULL;

-- Create index for upcoming exhibitions queries
CREATE INDEX IF NOT EXISTS idx_exhibitions_start_date ON exhibitions(start_date);
CREATE INDEX IF NOT EXISTS idx_exhibitions_end_date ON exhibitions(end_date);
CREATE INDEX IF NOT EXISTS idx_exhibitions_show_popup ON exhibitions(show_popup);
CREATE INDEX IF NOT EXISTS idx_exhibitions_slug ON exhibitions(slug);

-- Comment on new columns
COMMENT ON COLUMN exhibitions.images IS 'JSONB array of gallery images with URLs and bilingual captions';
COMMENT ON COLUMN exhibitions.videos IS 'JSONB array of video URLs (YouTube/Vimeo) with bilingual titles';
COMMENT ON COLUMN exhibitions.content_pt IS 'Rich text content in Portuguese (blog-like body)';
COMMENT ON COLUMN exhibitions.content_en IS 'Rich text content in English (blog-like body)';
COMMENT ON COLUMN exhibitions.show_popup IS 'Whether to show this exhibition as popup for upcoming events';
COMMENT ON COLUMN exhibitions.slug IS 'URL-friendly identifier for the exhibition';
