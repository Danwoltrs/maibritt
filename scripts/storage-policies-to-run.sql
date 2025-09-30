-- Supabase Storage RLS Policies for Artwork Images
-- These policies need to be run in the Supabase dashboard SQL editor or via CLI

-- Create the artworks bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artworks', 'artworks', true) 
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the artworks bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files to artworks bucket
CREATE POLICY "Allow authenticated users to upload artwork images"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'artworks');

-- Policy: Allow authenticated users to update their uploaded files  
CREATE POLICY "Allow authenticated users to update artwork images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'artworks');

-- Policy: Allow authenticated users to delete their uploaded files
CREATE POLICY "Allow authenticated users to delete artwork images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artworks');

-- Policy: Allow public read access to artwork images (for displaying on website)
CREATE POLICY "Allow public read access to artwork images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'artworks');

-- Additional policy for anon users to view images
CREATE POLICY "Allow anonymous users to view artwork images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'artworks');

-- Ensure the bucket allows public access for viewing
UPDATE storage.buckets 
SET public = true 
WHERE id = 'artworks';