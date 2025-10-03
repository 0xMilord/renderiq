-- Create storage buckets for file uploads
-- This migration creates the necessary storage buckets in Supabase

-- Note: This SQL needs to be run in Supabase SQL Editor, not through Drizzle
-- as it creates storage buckets which are Supabase-specific

-- Create renders bucket for generated images/videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'renders',
  'renders',
  true,
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'video/mp4']
);

-- Create uploads bucket for user-uploaded files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  false,
  104857600, -- 100MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
);

-- Create storage policies for renders bucket (public read, authenticated write)
CREATE POLICY "Public read access for renders" ON storage.objects
FOR SELECT USING (bucket_id = 'renders');

CREATE POLICY "Authenticated users can upload renders" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'renders' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own renders" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'renders' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own renders" ON storage.objects
FOR DELETE USING (
  bucket_id = 'renders' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for uploads bucket (private, user-specific)
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
