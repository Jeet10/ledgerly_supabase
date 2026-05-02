-- =========================
-- ORG LOGO STORAGE SETUP
-- =========================
-- This migration sets up the storage bucket for organization logos
-- It uses Supabase Storage (not a database table)

-- Enable storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage schema if it doesn't exist
-- Note: The storage schema and tables are created automatically by Supabase
-- This migration only configures the bucket and policies

-- Create storage bucket for org logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('org-logos', 'org-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Enable RLS on storage.objects for the org-logos bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload/update their own org logo
DROP POLICY IF EXISTS "Users can upload org logo" ON storage.objects;
CREATE POLICY "Users can upload org logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'org-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own org logo
DROP POLICY IF EXISTS "Users can update org logo" ON storage.objects;
CREATE POLICY "Users can update org logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'org-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own org logo
DROP POLICY IF EXISTS "Users can delete org logo" ON storage.objects;
CREATE POLICY "Users can delete org logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'org-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view org logos (public read)
DROP POLICY IF EXISTS "Public can view org logos" ON storage.objects;
CREATE POLICY "Public can view org logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');