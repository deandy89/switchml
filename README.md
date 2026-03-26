# 🎮 Switch ML - Automated Escrow & Marketplace for Mobile Legends

Switch ML adalah platform *marketplace* berbasis *escrow* (rekber) otomatis pertama yang dirancang khusus untuk transaksi jual-beli akun game Mobile Legends: Bang Bang (MLBB). 

Aplikasi ini menghilangkan risiko penipuan (scam/hackback) dengan mengotomatisasi proses *binding* akun menggunakan sistem penangkap Email OTP Realtime, Computer Vision untuk KYC, dan Payment Gateway terintegrasi.

---

## ✨ Fitur Utama (Business Logic)
1. **Role-Based System:** Pemisahan *dashboard* secara tegas antara `Buyer`, `Seller`, dan `Admin`.
2. **Universal Auto-KYC:** Pengecekan KTP otomatis menggunakan OCR (Ekstraksi NIK & Nama instan).
3. **Realtime OTP Catcher (The Core Engine):** Sistem yang menangkap email OTP dari Moonton dan menampilkannya secara *realtime* di layar menggunakan Webhooks dan WebSockets.
4. **2-Phase OTP Binding:** OTP pertama untuk Seller (*bind* akun), OTP kedua untuk Buyer (amankan akun).
5. **Automated Payment:** Terintegrasi dengan Xendit (Invoice & Webhook).
6. **Admin Control Panel:** *Dashboard* rahasia untuk memantau transaksi dan *user*.

---

## 🛠️ Tech Stack & Arsitektur Sistem
* **Framework:** Next.js (App Router) + React + Tailwind CSS
* **Database & Auth:** Supabase (PostgreSQL + Supabase Auth + Realtime Websockets)
* **Email Parser:** Mailgun (Inbound Routing)
* **Payment Gateway:** Xendit (Dynamic Invoice API)
* **Computer Vision (KYC):** OCR.space API

---

## ⚙️ Setup Environment Variables (PENTING)
Buat file `.env.local` dan isi dengan format berikut (JANGAN UPLOAD FILE INI KE GITHUB):
```env
NEXT_PUBLIC_SUPABASE_URL=[https://xxxxxxxxxxxx.supabase.co](https://xxxxxxxxxxxx.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_OCR_API_KEY=K8xxxxxxxxxx
XENDIT_SECRET_KEY=xnd_development_xxxxxxxxxxxxxxxxxxxxxx
XENDIT_WEBHOOK_TOKEN=token_webhook_anda
MAILGUN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=escrow.namadomainanda.com
```
