-- Exhibition Content Migration
-- Converts content_en/content_pt from TEXT to JSONB for block editor support
-- Adds main_image_mode column for fixed vs random cover image

-- ============ CONTENT COLUMNS TO JSONB ============
-- Wrap existing text content in a PageBuilder document structure (version 2)
ALTER TABLE exhibitions
  ALTER COLUMN content_pt TYPE jsonb
  USING CASE
    WHEN content_pt IS NULL OR content_pt = '' THEN NULL
    ELSE jsonb_build_object(
      'version', 2,
      'blocks', jsonb_build_array(
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'type', 'text',
          'width', 'full',
          'content', jsonb_build_object(
            'tiptapDoc', jsonb_build_object('type', 'doc', 'content',
              jsonb_build_array(
                jsonb_build_object('type', 'paragraph', 'content',
                  jsonb_build_array(
                    jsonb_build_object('type', 'text', 'text', content_pt)
                  )
                )
              )
            )
          )
        )
      )
    )
  END;

ALTER TABLE exhibitions
  ALTER COLUMN content_en TYPE jsonb
  USING CASE
    WHEN content_en IS NULL OR content_en = '' THEN NULL
    ELSE jsonb_build_object(
      'version', 2,
      'blocks', jsonb_build_array(
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'type', 'text',
          'width', 'full',
          'content', jsonb_build_object(
            'tiptapDoc', jsonb_build_object('type', 'doc', 'content',
              jsonb_build_array(
                jsonb_build_object('type', 'paragraph', 'content',
                  jsonb_build_array(
                    jsonb_build_object('type', 'text', 'text', content_en)
                  )
                )
              )
            )
          )
        )
      )
    )
  END;

-- ============ MAIN IMAGE MODE COLUMN ============
ALTER TABLE exhibitions
  ADD COLUMN IF NOT EXISTS main_image_mode text NOT NULL DEFAULT 'fixed';
