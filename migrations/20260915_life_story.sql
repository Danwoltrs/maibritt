-- Life story: one row holding the draft and the published document
CREATE TABLE IF NOT EXISTS story (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft jsonb NOT NULL,
  published jsonb,
  draft_updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE story ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of story" ON story;
CREATE POLICY "Allow public read of story"
  ON story FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated update of story" ON story;
CREATE POLICY "Allow authenticated update of story"
  ON story FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- Exactly one row, created empty
INSERT INTO story (draft)
SELECT '{"version":1,"opening":{"name":"","title":"","portrait":null,"cover":null},"chapters":[]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM story);

-- Storage bucket for photos, audio, video and posters (500 MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('story', 'story', true, 524288000)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 524288000;

DROP POLICY IF EXISTS "Allow public read of story media" ON storage.objects;
CREATE POLICY "Allow public read of story media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'story');

DROP POLICY IF EXISTS "Allow authenticated upload to story bucket" ON storage.objects;
CREATE POLICY "Allow authenticated upload to story bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'story');

DROP POLICY IF EXISTS "Allow authenticated update in story bucket" ON storage.objects;
CREATE POLICY "Allow authenticated update in story bucket"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'story') WITH CHECK (bucket_id = 'story');

DROP POLICY IF EXISTS "Allow authenticated delete from story bucket" ON storage.objects;
CREATE POLICY "Allow authenticated delete from story bucket"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'story');
