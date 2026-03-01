-- Add freight cost tracking and exhibition assignment to artworks
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS freight_cost numeric;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS freight_currency text DEFAULT 'BRL';
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS freight_notes text;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS exhibition_id uuid REFERENCES exhibitions(id);
