-- Add timeline display fields for River Magazine timeline
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS show_on_timeline boolean DEFAULT false;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS artwork_status text DEFAULT 'studio';
ALTER TABLE exhibitions ADD COLUMN IF NOT EXISTS show_on_timeline boolean DEFAULT true;
