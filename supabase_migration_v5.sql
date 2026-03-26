-- Migration for Mega Architecture Update: Role & Universal KYC

-- 1. Tambahkan kolom role (default: buyer)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer';

-- 2. Ubah kolom kyc_status dari boolean menjadi text (unverified, pending, verified, rejected)
-- Supabase PostgreSQL memerlukan sedikit trik type casting jika tabel sudah ada isinya
ALTER TABLE users 
  ALTER COLUMN kyc_status DROP DEFAULT,
  ALTER COLUMN kyc_status TYPE TEXT USING (
    CASE 
      WHEN kyc_status = true THEN 'verified'
      ELSE 'unverified'
    END
  ),
  ALTER COLUMN kyc_status SET DEFAULT 'unverified';
