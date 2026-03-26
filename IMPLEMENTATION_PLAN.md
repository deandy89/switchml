# 🚀 IMPLEMENTATION PLAN — Switch ML Marketplace

> **Referensi**: `switchml.prd` (Single Source of Truth)
> **Tech Stack**: Next.js App Router · TypeScript · Tailwind CSS · Framer Motion · Supabase · Mailgun · Vercel

---

## Tahap 1: Supabase Client Setup

- [ ] Buat file `src/lib/supabase/client.ts` — Supabase **browser** client (`createBrowserClient`).
- [ ] Buat file `src/lib/supabase/server.ts` — Supabase **server** client (untuk API routes & Server Components).
- [ ] Pastikan environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) terhubung dengan benar.
- [ ] Jalankan SQL schema dari PRD di Supabase Dashboard (tabel `users`, `listings`, `transactions`).
- [ ] Aktifkan Supabase Realtime pada tabel `transactions` (`ALTER PUBLICATION supabase_realtime ADD TABLE transactions`).

---

## Tahap 2: UI Dashboard — Tema "Cyber-Dawn"

- [ ] Setup design system di `src/app/globals.css`:
  - Deep Space Purple background (`#2D004B`), Dark Mode wajib.
  - Electric Neon Blue primary (`#00D1FF`) dengan efek glow/shadow.
  - Vivid Magenta accent (`#FF00E5`).
- [ ] Buat komponen **Glassmorphism Card** (`bg-white/10 backdrop-blur-md border border-white/20`).
- [ ] Buat layout utama (`src/app/layout.tsx`) dengan navigasi & branding Switch ML.
- [ ] Buat halaman **Landing Page** (`src/app/page.tsx`) — hero section, fitur unggulan, CTA.
- [ ] Buat halaman **Marketplace / Listings** (`src/app/listings/page.tsx`) — grid kartu akun ML yang dijual.
- [ ] Buat halaman **Detail Listing** (`src/app/listings/[id]/page.tsx`) — info akun, tombol beli.
- [ ] Buat halaman **Transaction Tracker** (`src/app/transactions/[id]/page.tsx`) — live progress bar + OTP display.

---

## Tahap 3: Mailgun Webhook API

- [ ] Buat endpoint `POST /api/webhooks/mailgun` di `src/app/api/webhooks/mailgun/route.ts`.
- [ ] Parse incoming request menggunakan `await request.formData()` (Mailgun mengirim `multipart/form-data`).
- [ ] Ekstrak field `stripped-text` atau `body-plain` dari form data.
- [ ] Identifikasi alamat escrow email dari field `recipient` atau `To`.
- [ ] Ekstrak 6-digit OTP menggunakan Regex `/\d{6}/`.
- [ ] Update kolom `otp_code` dan `status` di tabel `transactions` via Supabase service-role client.
- [ ] Tambahkan validasi keamanan (cek sender domain = `moonton.com`, verifikasi Mailgun signature).

---

## Tahap 4: Supabase Realtime — OTP Listener

- [ ] Buat komponen client `src/components/OtpListener.tsx` (`"use client"`).
- [ ] Subscribe ke channel Supabase Realtime pada tabel `transactions` (filter by `transaction_id`).
- [ ] Tampilkan **OTP Glow Box** dengan animasi Framer Motion saat `otp_code` berubah dari `null` → kode 6-digit.
- [ ] Tampilkan live status tracker (waiting → OTP received → completed).
- [ ] Integrasikan `OtpListener` ke halaman Transaction Tracker.

---

## Tahap 5: Escrow Email Generation & Transaction Flow

- [ ] Buat logic pembuatan alamat email escrow unik saat checkout (format: `trx-{uuid}@escrow.switchml.com`).
- [ ] Buat API endpoint `POST /api/transactions` untuk membuat transaksi baru.
- [ ] Implementasi flow checkout: Buyer klik beli → buat transaksi → tampilkan escrow email ke Seller.
- [ ] Update status transaksi melalui flow: `waiting_payment` → `payment_confirmed` → `waiting_otp` → `otp_received` → `completed`.

---

## Tahap 6: Authentication & User Management

- [ ] Setup Supabase Auth (email/password atau magic link).
- [ ] Buat halaman **Login/Register** (`src/app/auth/page.tsx`).
- [ ] Implementasi middleware Next.js untuk proteksi halaman yang memerlukan auth.
- [ ] Buat halaman **Profile / Dashboard User** — saldo, riwayat transaksi, status KYC.

---

## Tahap 7: Polish, Testing & Deploy

- [ ] Responsive design — pastikan UI optimal di mobile & desktop.
- [ ] Error handling & loading states di semua halaman.
- [ ] Animasi micro-interaction menggunakan Framer Motion (hover effects, page transitions).
- [ ] Setup Vercel deployment (environment variables, domain, build config).
- [ ] End-to-end testing: simulasi full flow dari listing → checkout → OTP capture → completion.
- [ ] Konfigurasi Mailgun Inbound Route agar mengarah ke endpoint Vercel production.

---

> **Catatan**: Setiap tahap sebaiknya di-commit secara terpisah untuk memudahkan tracking & rollback.
