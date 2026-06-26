CREATE TABLE IF NOT EXISTS image_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id    UUID REFERENCES artworks(id) ON DELETE CASCADE,
  source_path   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','detecting','processing','done','failed')),
  stage         TEXT,
  frame_preset  TEXT NOT NULL DEFAULT 'oak-floater',
  quad          JSONB,
  result        JSONB,
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_jobs_artwork ON image_jobs(artwork_id);
CREATE INDEX IF NOT EXISTS idx_image_jobs_status  ON image_jobs(status);

ALTER TABLE image_jobs ENABLE ROW LEVEL SECURITY;

-- Public read access (mirrors create-exhibitions-table.sql)
CREATE POLICY "Allow public read access to image_jobs" ON image_jobs
  FOR SELECT USING (true);

-- Admin full access (mirrors create-exhibitions-table.sql: auth.jwt() ->> 'role' = 'admin')
CREATE POLICY "Allow admin full access to image_jobs" ON image_jobs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

GRANT ALL ON image_jobs TO authenticated;
GRANT SELECT ON image_jobs TO anon;
