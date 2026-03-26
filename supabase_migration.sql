-- ============================================
-- Switch ML: Migration — Enhanced Listings + KYC
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================

-- ══════════════════════════════════════════════
-- BAGIAN 1: LISTING ENHANCEMENTS
-- ══════════════════════════════════════════════

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS rank text,
  ADD COLUMN IF NOT EXISTS hero_count integer,
  ADD COLUMN IF NOT EXISTS skin_count integer,
  ADD COLUMN IF NOT EXISTS diamonds integer,
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Storage bucket untuk gambar listing
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read listing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own listing images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ══════════════════════════════════════════════
-- BAGIAN 2: KYC ENHANCEMENTS
-- ══════════════════════════════════════════════

-- Ubah kyc_status dari boolean ke text (pending/verified/rejected)
ALTER TABLE users
  ALTER COLUMN kyc_status TYPE text USING CASE WHEN kyc_status THEN 'verified' ELSE 'none' END;
ALTER TABLE users
  ALTER COLUMN kyc_status SET DEFAULT 'none';

-- Tambah kolom KYC baru
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nik text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS kyc_image_url text;

-- Storage bucket untuk dokumen KYC (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload KYC docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can read own KYC docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
