-- Migration for Role Registration

-- 1. Tambahkan kolom role (default: buyer)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer';

-- Abaikan migrasi kyc_status yang sebelumnya, biarkan tetap BOOLEAN sesuai permintaan baru.
