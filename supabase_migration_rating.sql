-- Migration Phase 9: Seller Rating & Cancel Status
-- Jalankan kode SQL ini di fitur SQL Editor pada Supabase Dashboard Anda.

-- 1. Tambahkan kolom 'rating' dengan nilai default 5.0 (sempurna) bagi semua user.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1) DEFAULT 5.0;

-- 2. (Opsional namun direkomendasikan) Tambahkan Constraint Max Rating
-- ALTER TABLE public.users ADD CONSTRAINT rating_check CHECK (rating >= 1.0 AND rating <= 5.0);

-- Catatan: Kolom status transaksi tidak menggunakan Enum kaku, melainkan TEXT di schema kita sebelumnya.
-- Jadi string 'cancelled' sudah otomatis didukung tanpa perlu ALTER TYPE.

-- Selesai.
