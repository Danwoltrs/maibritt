-- Site settings table for global configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default carousel settings
INSERT INTO site_settings (key, value, description) VALUES
  ('carousel_rotation_speed', '"30000"', 'Carousel auto-rotation interval in milliseconds (default: 30 seconds)'),
  ('carousel_auto_play', 'true', 'Enable/disable carousel auto-play'),
  ('carousel_transition_style', '"fade"', 'Carousel transition style: fade, slide, or zoom'),
  ('carousel_pause_on_hover', 'true', 'Pause carousel when user hovers over it')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();
