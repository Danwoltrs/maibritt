-- Add is_visible field to exhibitions table
ALTER TABLE exhibitions
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_exhibitions_visible
ON exhibitions(is_visible)
WHERE is_visible = true;

-- Update existing records to be visible by default
UPDATE exhibitions SET is_visible = true WHERE is_visible IS NULL;
