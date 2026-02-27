-- Add commission and sale tracking columns to artworks table

ALTER TABLE artworks ADD COLUMN IF NOT EXISTS sold_through_gallery_id UUID REFERENCES galleries(id);
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS sale_type TEXT; -- 'gallery', 'direct', 'online'
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS commission_amount NUMERIC;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS net_amount NUMERIC;
