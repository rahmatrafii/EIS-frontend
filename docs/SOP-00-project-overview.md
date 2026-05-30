# SOP-00 — Project Overview & Master Conventions

> **Versi**: 2.0.0  
> **Project**: EIS Frontend (Zoo Companion App)  
> **Stack**: Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide React  
> **Berlaku untuk**: Semua kontributor dan sesi vibe coding

---

## 1. Apa Itu Proyek Ini?

**Zoo Companion App** adalah aplikasi frontend untuk sistem **EIS Engine (Educational Impact Score Engine)** — platform yang mengukur dampak edukasi kunjungan kebun binatang. Aplikasi ini terdiri dari **dua sub-aplikasi** dalam satu proyek Next.js:

| Sub-aplikasi | Target Device | Jumlah Halaman | Role |
|---|---|---|---|
| **Visitor App** | Mobile Web (Browser HP) | 18 halaman | `visitor` |
| **Admin App** | Desktop Browser | 10 halaman | `admin` |

**Total: 28 halaman.** Semua komunikasi dengan backend menggunakan **REST API JSON**.

---

## 2. Peta 28 Halaman

### Visitor App (Mobile) — 18 Halaman

**Onboarding & Auth (4)**
| # | Halaman | Route | Keterangan |
|---|---------|-------|-----------|
| V-01 | Selamat Datang | `/welcome` | Halaman pertama saat scan QR gerbang |
| V-02 | Registrasi | `/register` | Form nama, email, tanggal lahir |
| V-03 | Verifikasi OTP | `/verify-otp` | Input 6 digit OTP dari email |
| V-04 | Login | `/login` | Email → OTP untuk returning visitor |

**Sesi Kunjungan (3)**
| # | Halaman | Route | Keterangan |
|---|---------|-------|-----------|
| V-05 | Pre-Test | `/quiz/pre-zoo` | Kuis sebelum masuk, muncul setelah login |
| V-06 | Home / Dashboard | `/home` | Pusat navigasi selama kunjungan |
| V-07 | Scan QR | `/scan` | Kamera HP untuk scan QR kandang |

**Kandang & Konten (5)**
| # | Halaman | Route | Keterangan |
|---|---------|-------|-----------|
| V-08 | Halaman Kandang | `/exhibit/[exhibit_id]` | Info satwa + 4 tombol media |
| V-09 | Audio Player | `/exhibit/[exhibit_id]/audio` | Putar audio satwa |
| V-10 | Video Player | `/exhibit/[exhibit_id]/video` | Putar video satwa |
| V-11 | Infografis | `/exhibit/[exhibit_id]/infographic` | Gambar infografis full screen |
| V-12 | Interactive Lab | `/exhibit/[exhibit_id]/lab` | Mini-game edukasi |

**Assessment & Hasil (3)**
| # | Halaman | Route | Keterangan |
|---|---------|-------|-----------|
| V-13 | Post-Test | `/quiz/post-zoo` | Kuis saat scan QR pintu keluar |
| V-14 | Hasil Kunjungan | `/visit-result` | Ringkasan setelah post-test |
| V-15 | EIS Score | `/score` | Skor akhir + grade + badge |

**Retensi & Profil (3)**
| # | Halaman | Route | Keterangan |
|---|---------|-------|-----------|
| V-16 | Profil | `/profile` | Data pengunjung + riwayat kunjungan |
| V-17 | Retention Quiz | `/retention/[token]` | Dibuka dari link email H+7 / H+30 |
| V-18 | Status Retensi | `/profile/retention-status` | Status kuis H+7 dan H+30 |

### Admin App (Desktop) — 10 Halaman

**Auth (1)**
| # | Halaman | Route | Keterangan |
|---|---------|-------|-----------|
| A-01 | Login Admin | `/admin/login` | Email + OTP, terpisah dari visitor |

**Dashboard & Analytics (4)**
| # | Halaman | Route | Keterangan |
|---|---------|-------|-----------|
| A-02 | Dashboard Utama | `/admin/dashboard` | Overview + grafik tren |
| A-03 | Analytics Kandang | `/admin/analytics/exhibits` | Top kandang, efektivitas media |
| A-04 | Analytics Pengunjung | `/admin/analytics/visitors` | Distribusi EIS, media efektif |
| A-05 | Detail Pengunjung | `/admin/analytics/visitors/[user_id]` | EIS detail satu pengunjung |

**Manajemen Konten (5)**
| # | Halaman | Route | Keterangan |
|---|---------|-------|-----------|
| A-06 | Daftar Kandang | `/admin/exhibits` | Tabel semua kandang |
| A-07 | Detail Kandang | `/admin/exhibits/[exhibit_id]` | Edit + kelola konten + QR |
| A-08 | Tambah Kandang | `/admin/exhibits/new` | Form buat kandang baru |
| A-09 | Manajemen Kuis | `/admin/quizzes` | Daftar semua kuis |
| A-10 | Tambah/Edit Kuis | `/admin/quizzes/[quiz_id]` | Form kuis + soal-soal |

---

## 3. Prinsip Utama Yang TIDAK BOLEH Dilanggar

```
1. SATU cara penulisan untuk setiap pola — tidak ada variasi gaya antar file
2. TypeScript STRICT — tidak ada `any`, tidak ada `as unknown`
3. Server Component by default — Client Component hanya jika benar-benar perlu
4. Semua teks UI dalam Bahasa Indonesia (kecuali kode teknis)
5. Tidak ada logika bisnis di dalam JSX — ekstrak ke hook atau util
6. Tidak ada inline style — semua styling via Tailwind class
7. Tidak ada magic number — semua konstanta di `src/constants/`
8. Setiap fetch ke API WAJIB handle loading, error, dan empty state
9. Visitor App = mobile-first (max-width 430px, touch-friendly)
10. Admin App = desktop-first (min-width 1024px, sidebar layout)
```

---

## 4. Daftar SOP & Ruang Lingkupnya

| File | Topik |
|------|-------|
| `SOP-00-project-overview.md` | Dokumen ini — overview, peta 28 halaman, master conventions |
| `SOP-01-folder-structure.md` | Struktur folder & aturan penempatan file |
| `SOP-02-naming-conventions.md` | Penamaan file, komponen, variabel, tipe |
| `SOP-03-component-architecture.md` | Cara menulis komponen: Server vs Client, pattern |
| `SOP-04-api-integration.md` | Cara fetch API, error handling, tipe response |
| `SOP-05-state-management.md` | State lokal, URL state, context, caching |
| `SOP-06-styling-system.md` | Tailwind v4, design tokens, cn() utility |
| `SOP-07-authentication.md` | JWT, OTP flow, route protection, role guard |
| `SOP-08-form-handling.md` | Form, validasi client-side, submit pattern |
| `SOP-09-animation.md` | Framer Motion conventions & reusable variants |
| `SOP-10-typescript.md` | Type definitions, generics, shared types |
| `SOP-11-error-handling.md` | Error boundary, toast, API error shape |
| `SOP-12-testing-checklist.md` | QA manual checklist sebelum push |
| `SOP-13-page-specs-visitor.md` | **Spesifikasi lengkap 18 halaman Visitor App** |
| `SOP-14-page-specs-admin.md` | **Spesifikasi lengkap 10 halaman Admin App** |
| `SOP-15-mobile-ux.md` | **Panduan UX & layout khusus Mobile Visitor App** |

---

## 5. Environment Variables

```bash
# .env.local (jangan di-commit)
NEXT_PUBLIC_API_BASE_URL=https://api.eisengine.com/api/v1
NEXT_PUBLIC_APP_NAME=Zoo Companion
```

```ts
// src/constants/env.ts — SELALU akses via sini, bukan langsung process.env
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Zoo Companion'
```

---

## 6. Alur Kerja Fitur Baru

```
1. Baca SOP-13 atau SOP-14 untuk spesifikasi halaman yang akan dibuat
2. Baca SOP yang relevan lainnya (form → SOP-08, animasi → SOP-09, dst)
3. Buat / update tipe TypeScript di src/types/ terlebih dahulu
4. Buat API service function di src/services/ jika belum ada
5. Buat custom hook jika ada state/efek
6. Buat komponen UI
7. Sambungkan di halaman (page.tsx)
8. Pastikan semua state: loading ✓ error ✓ empty ✓ success ✓
9. Jalankan checklist SOP-12 sebelum push
```
