-- Supabase Storage RLS Policies for Artwork Images
-- These policies need to be run in the Supabase dashboard SQL editor or via CLI

-- First, create the artworks bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artworks', 'artworks', true) 
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update artwork images" ON storage.objects;  
DROP POLICY IF EXISTS "Allow authenticated users to delete artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous users to view artwork images" ON storage.objects;

-- Policy: Allow authenticated users to upload files to artworks bucket
CREATE POLICY "Allow authenticated users to upload artwork images"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'artworks' AND auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update their uploaded files  
CREATE POLICY "Allow authenticated users to update artwork images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'artworks' AND auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete their uploaded files
CREATE POLICY "Allow authenticated users to delete artwork images"
ON storage.objects FOR DELETE
USING (bucket_id = 'artworks' AND auth.role() = 'authenticated');

-- Policy: Allow public read access to artwork images (for displaying on website)
CREATE POLICY "Allow public read access to artwork images"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');