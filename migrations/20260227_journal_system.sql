-- Journal System Migration
-- Converts blog_posts content columns to JSONB for Tiptap rich text editor
-- Adds public read RLS, journal storage bucket, and view count RPC

-- ============ CONTENT COLUMNS TO JSONB ============
-- Wrap existing text content in minimal Tiptap document structure
ALTER TABLE blog_posts
  ALTER COLUMN content_pt TYPE jsonb
  USING CASE
    WHEN content_pt IS NULL OR content_pt = '' THEN NULL
    ELSE jsonb_build_object('type', 'doc', 'content',
      jsonb_build_array(
        jsonb_build_object('type', 'paragraph', 'content',
          jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', content_pt)
          )
        )
      )
    )
  END;

ALTER TABLE blog_posts
  ALTER COLUMN content_en TYPE jsonb
  USING CASE
    WHEN content_en IS NULL OR content_en = '' THEN NULL
    ELSE jsonb_build_object('type', 'doc', 'content',
      jsonb_build_array(
        jsonb_build_object('type', 'paragraph', 'content',
          jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', content_en)
          )
        )
      )
    )
  END;

-- ============ RLS POLICIES ============
-- Enable RLS if not already
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read: only published posts
DROP POLICY IF EXISTS "Allow public read of published journal posts" ON blog_posts;
CREATE POLICY "Allow public read of published journal posts"
  ON blog_posts FOR SELECT
  USING (published = true);

-- Authenticated write: full access for the artist
DROP POLICY IF EXISTS "Allow authenticated full access to blog_posts" ON blog_posts;
CREATE POLICY "Allow authenticated full access to journal posts"
  ON blog_posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal', 'journal', true)
ON CONFLICT (id) DO NOTHING;

-- Storage: public read
DROP POLICY IF EXISTS "Allow public read of journal images" ON storage.objects;
CREATE POLICY "Allow public read of journal images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal');

-- Storage: authenticated upload/delete
DROP POLICY IF EXISTS "Allow authenticated upload to journal bucket" ON storage.objects;
CREATE POLICY "Allow authenticated upload to journal bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'journal');

DROP POLICY IF EXISTS "Allow authenticated delete from journal bucket" ON storage.objects;
CREATE POLICY "Allow authenticated delete from journal bucket"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'journal');

-- ============ VIEW COUNT RPC ============
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
