# SOP-14 — Spesifikasi Halaman Admin App (10 Halaman)

> **Konteks**: Semua halaman admin adalah **Desktop Browser** (min-width 1024px). Layout menggunakan sidebar kiri + area konten kanan. Baca **SOP-15** untuk panduan layout sebelum mengerjakan halaman apapun di sini.

---

## Layout Admin — Shell Utama

Semua halaman admin (kecuali A-01 Login) menggunakan layout berikut:

```
┌─────────────────────────────────────────────────────┐
│  Topbar (tinggi 64px): Logo | breadcrumb | user info │
├──────────────┬──────────────────────────────────────┤
│              │                                        │
│   Sidebar    │         Area Konten Utama              │
│  (240px)     │         (flex-1, scroll)               │
│              │                                        │
│  - Dashboard │                                        │
│  - Analytics │                                        │
│  - Kandang   │                                        │
│  - Kuis      │                                        │
│              │                                        │
└──────────────┴──────────────────────────────────────┘
```

**Komponen layout**:
- `AdminShell.tsx` — wrapper keseluruhan
- `Sidebar.tsx` — navigasi kiri dengan highlight aktif
- `Topbar.tsx` — header dengan breadcrumb dan info user admin

---

## A-01 — Login Admin (`/admin/login`)

**API**: `POST /users/request-otp` → `POST /users/verify-otp`

**Konten:**
- Halaman centered, tidak ada sidebar
- Logo ZOO Admin di atas
- Card login di tengah layar (max-width 400px)
- Dua langkah dalam satu card:

**Step 1 — Email:**
- Input email admin
- Tombol **"Kirim Kode OTP"**
- Teks kecil: *"Masukkan email yang terdaftar sebagai admin"*

**Step 2 — OTP (muncul setelah email berhasil):**
- `OtpInput` 6 digit
- Countdown 60 detik + tombol resend
- Tombol **"Masuk ke Dashboard"**

**Flow setelah login sukses:**
1. Simpan JWT token
2. Set cookie `eis_auth=1` dan `eis_role=admin`
3. Redirect ke `/admin/dashboard`

**Validasi:**
- Jika role bukan `admin` → tolak dengan pesan: *"Akun ini tidak memiliki akses admin"*
- Token JWT admin expire lebih cepat (1 hari, dikontrol backend)

**State**: `step: 'email' | 'otp'`, `email`, `otp`, `countdown`, `isLoading`, `error`

**Catatan:**
- Background halaman: putih bersih atau pattern abstrak halus
- Tidak ada link ke halaman visitor — ini portal terpisah
- Jika sudah login sebagai admin → redirect langsung ke `/admin/dashboard`

---

## A-02 — Dashboard Utama (`/admin/dashboard`)

**API**: `GET /analytics/dashboard`

**Konten:**

**1. Stats Row — 4 kartu angka:**
| Kartu | Data | Icon |
|-------|------|------|
| Total Pengunjung | `total_visitors` | 👥 |
| Rata-rata EIS Score | `avg_eis_score` | 📊 |
| Rata-rata Durasi | `avg_duration_minutes` menit | ⏱️ |
| Sesi Aktif Hari Ini | `active_sessions_today` | 🟢 |

Setiap kartu menggunakan komponen `StatsCard.tsx`:
- Angka besar dengan animasi count-up
- Label di bawah
- Icon di pojok kanan atas
- Perubahan vs kemarin (contoh: `+12%`) dengan warna hijau/merah

**2. Grafik Tren Pengunjung (7 hari terakhir):**
- Komponen `TrendChart.tsx` menggunakan library `recharts`
- Line chart: sumbu X = tanggal, sumbu Y = jumlah pengunjung
- Warna emerald-500

**3. Top 5 Kandang Terpopuler:**
- Tabel sederhana: ranking | nama kandang | jumlah kunjungan | rata-rata durasi
- Komponen `ExhibitTable.tsx` (versi mini)
- Link "Lihat semua" → `/admin/analytics/exhibits`

**4. Distribusi EIS Score:**
- Bar chart horizontal: Grade A/B/C/D/S → jumlah pengunjung per grade
- Komponen `EisBreakdownChart.tsx`

**5. Efektivitas Media:**
- 4 kartu kecil per jenis media: Audio / Video / Infografis / Lab Interaktif
- Setiap kartu: rata-rata knowledge gain + jumlah penggunaan
- Warna berbeda per media (orange/blue/purple/green)

**State**: `dashboard`, `isLoading`, `error`

**Query params opsional**: `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`

**Catatan:**
- Gunakan `Suspense` + `loading.tsx` untuk skeleton loading
- Grafik recharts hanya di client component
- Default range: 30 hari terakhir

---

## A-03 — Analytics Kandang (`/admin/analytics/exhibits`)

**API**: `GET /analytics/dashboard` (dengan filter)

**Konten:**

**1. Filter Bar:**
- Date range picker (date_from, date_to) — gunakan 2 `<input type="date">`
- Filter kategori usia (All / CHILD / TEEN / ADULT) — dropdown atau radio

**2. Tabel Top Kandang:**
Komponen `ExhibitTable.tsx` dengan kolom:
| Kolom | Keterangan |
|-------|-----------|
| # | Ranking |
| Kandang | Nama + zona |
| Total Kunjungan | Jumlah check-in |
| Rata-rata Durasi | Menit |
| Media Terpopuler | Chip jenis media |
| Knowledge Gain | Rata-rata selisih pre-post |

- Sortable per kolom (click header)
- Pagination 10 per halaman

**3. Grafik Efektivitas Media per Kandang:**
- Grouped bar chart: per kandang, 4 bar (Audio/Video/Infografis/Lab)
- Tinggi bar = rata-rata knowledge gain user yang pakai media tersebut

**4. Heatmap Waktu Kunjungan:**
- Grid 7×24 (hari × jam)
- Warna lebih gelap = lebih banyak kunjungan
- Membantu admin tahu jam sibuk

**State**: `data`, `filters`, `sortBy`, `sortDir`, `page`, `isLoading`

---

## A-04 — Analytics Pengunjung (`/admin/analytics/visitors`)

**API**: `GET /analytics/dashboard`

**Konten:**

**1. Filter Bar:**
- Date range
- Filter grade (All / A / B / C / D / S)
- Filter kategori usia

**2. Distribusi EIS Score:**
- Histogram: sumbu X = range score (0-10, 10-20, ..., 90-100), sumbu Y = jumlah pengunjung
- Komponen `EisBreakdownChart.tsx`

**3. Performa per Kategori Usia:**
- 3 kartu (CHILD / TEEN / ADULT):
  - Rata-rata EIS Score
  - Jumlah pengunjung
  - Media favorit
  - Progress bar EIS

**4. Tabel Pengunjung:**
Komponen `VisitorTable.tsx` dengan kolom:
| Kolom | Keterangan |
|-------|-----------|
| Nama | Nama pengunjung |
| Kategori | CHILD / TEEN / ADULT |
| Tanggal | Tanggal kunjungan terakhir |
| EIS Score | Angka + badge grade |
| Aksi | Tombol "Detail" → A-05 |

- Search by nama atau email
- Pagination 20 per halaman

**State**: `visitors`, `filters`, `search`, `page`, `isLoading`

---

## A-05 — Detail Pengunjung (`/admin/analytics/visitors/[user_id]`)

**API**: `GET /analytics/eis/{user_id}`

**Konten:**

**1. Header Profil Pengunjung:**
- Avatar inisial + nama + email + kategori usia
- Badge EIS grade terbaru
- Tanggal kunjungan pertama dan terakhir

**2. EIS Score Panel:**
- Komponen `EisScoreDisplay.tsx` (reuse dari visitor app)
- Total score + breakdown 3 komponen
- Semua progress bar dengan nilai

**3. Riwayat Kunjungan:**
- Timeline vertikal: setiap entry = satu sesi kunjungan
- Per entry: tanggal, durasi, kandang dikunjungi (chip), skor pre/post, EIS final
- Clickable untuk expand detail

**4. Status Retensi:**
- Komponen `RetentionStatusCard.tsx`
- Status H+7 dan H+30: PENDING / SENT / COMPLETED / EXPIRED + skor jika completed

**5. Rincian Media yang Digunakan:**
- Pie chart: proporsi penggunaan per jenis media
- Komponen `EisBreakdownChart.tsx`

**State**: `eisData`, `isLoading`, `error`

**Catatan:**
- Breadcrumb: Dashboard → Analytics Pengunjung → [Nama Pengunjung]
- Tombol back ke A-04

---

## A-06 — Daftar Kandang (`/admin/exhibits`)

**API**: `GET /admin/exhibits`

**Konten:**

**1. Header Halaman:**
- Judul "Manajemen Kandang"
- Tombol **"+ Tambah Kandang"** → `/admin/exhibits/new`
- Filter: `is_active` (All / Aktif / Nonaktif), `zone_name`

**2. Tabel Kandang:**
Komponen `ExhibitTable.tsx` (versi full) dengan kolom:
| Kolom | Keterangan |
|-------|-----------|
| Nama | Nama kandang + zona |
| Status Konten | Chip per kategori usia (CHILD/TEEN/ADULT): ✅ jika ada teks DAN media, ⚠️ jika sebagian, ❌ jika kosong |
| Status | Badge Aktif / Nonaktif |
| Dibuat | Tanggal |
| Aksi | Edit (→ A-07) \| Nonaktifkan |

**3. Aksi Nonaktifkan:**
- Klik tombol "Nonaktifkan" → konfirmasi dialog (modal) → `DELETE /admin/exhibits/{id}` (soft delete)
- Setelah nonaktif: baris berubah warna (gray-100) + badge "Nonaktif"

**State**: `exhibits`, `filters`, `isLoading`, `deletingId`

**Catatan:**
- Status konten dihitung dari field `content_status` yang dikembalikan backend
- Bisa sortir berdasarkan nama atau status

---

## A-07 — Detail & Edit Kandang (`/admin/exhibits/[exhibit_id]`)

**API**:
- `GET /admin/exhibits` (ambil data exhibit)
- `POST /admin/content` (simpan materi teks)
- `POST /admin/media` (tambah media)
- `DELETE /admin/exhibits/{id}` (nonaktifkan)

**Konten (dibagi dalam Tab):**

**Tab 1 — Informasi Kandang:**
- Field: Nama Kandang, Nama Zona, Deskripsi
- Tombol **"Simpan Perubahan"** (saat ini hanya display — backend belum ada endpoint update exhibit)
- **QR Code Display:** komponen `QrCodeDisplay.tsx`
  - Tampilkan QR Code dari `qr_code_identifier`
  - Generate QR menggunakan library `qrcode.react`
  - Tombol **"Unduh QR"** → download sebagai PNG
  - Instruksi: *"Cetak QR Code ini dan tempel di depan kandang"*

**Tab 2 — Materi Edukasi:**
- 3 panel accordion per kategori usia (CHILD / TEEN / ADULT)
- Setiap panel berisi form `ContentEditor.tsx`:
  - Field: Judul Konten, Isi Konten (textarea panjang)
  - Tombol **"Simpan"** → `POST /admin/content`
  - Status: "✅ Sudah ada konten" atau "❌ Belum ada konten"

**Tab 3 — Media:**
- Grid media yang sudah ada (per kategori usia)
- Setiap item: thumbnail/icon + judul + jenis media
- Tombol **"+ Tambah Media"** → buka form `MediaUploader.tsx`:
  - Field: Judul, Jenis Media (AUDIO/VIDEO/IMAGE_INFOGRAPHIC/INTERACTIVE_LAB), Kategori Usia
  - Field URL: input URL Cloudinary (bukan upload langsung — admin upload ke Cloudinary sendiri dulu, lalu paste URL di sini)
  - Tombol **"Simpan"** → `POST /admin/media`

**Tab 4 — Statistik Kandang:**
- Mini dashboard: total kunjungan, rata-rata durasi, media terpopuler
- Data dari `GET /analytics/dashboard` dengan filter exhibit_id

**State**: `exhibit`, `activeTab`, `isLoadingContent`, `isSavingContent`, `isSavingMedia`

**Catatan:**
- Form konten dan media auto-save saat submit, bukan saat keluar tab
- Tampilkan toast sukses/error setelah setiap save
- Package tambahan: `qrcode.react`

---

## A-08 — Tambah Kandang (`/admin/exhibits/new`)

**API**: `POST /admin/exhibits`

**Konten:**
- Form `ExhibitForm.tsx`:

| Field | Type | Validasi |
|-------|------|---------|
| Nama Kandang | text | Wajib, min 2, max 100 karakter |
| Nama Zona | text | Wajib, min 2, max 50 karakter |
| Deskripsi | textarea | Opsional |

- Tombol **"Buat Kandang"** → `POST /admin/exhibits`
- Tombol **"Batal"** → kembali ke `/admin/exhibits`

**Flow setelah submit sukses:**
1. Backend generate `qr_code_identifier` otomatis
2. Redirect ke `/admin/exhibits/{id}` (halaman detail)
3. Tampilkan toast: *"Kandang berhasil dibuat! QR Code sudah tersedia di tab Informasi."*

**State**: `form`, `errors`, `isSubmitting`

**Catatan:**
- Halaman sederhana — hanya form + tombol
- Breadcrumb: Kandang → Tambah Kandang

---

## A-09 — Manajemen Kuis (`/admin/quizzes`)

**API**: Tidak ada endpoint khusus list kuis — data dari `GET /admin/exhibits` yang include kuis

> **Catatan implementasi**: Backend belum memiliki endpoint GET list kuis. Untuk sementara, tampilkan halaman dengan state kosong + tombol "Tambah Kuis Baru". Data kuis bisa diambil via context kandang.

**Konten:**

**1. Header:**
- Judul "Manajemen Kuis"
- Tombol **"+ Tambah Kuis"** → `/admin/quizzes/new`

**2. Filter:**
- Jenis kuis: All / PRE_ZOO / POST_ZOO / RETENTION_1W / RETENTION_1M
- Kategori usia: All / CHILD / TEEN / ADULT
- Scope: All / GLOBAL / EXHIBIT

**3. Tabel Kuis:**
Komponen `QuizTable.tsx` dengan kolom:
| Kolom | Keterangan |
|-------|-----------|
| Judul | Judul kuis |
| Jenis | Badge: PRE_ZOO / POST_ZOO / dll |
| Untuk | Badge usia: CHILD / TEEN / ADULT |
| Scope | GLOBAL atau nama kandang |
| Jumlah Soal | Angka |
| Aksi | Edit (→ A-10) |

**State**: `quizzes`, `filters`, `isLoading`

---

## A-10 — Tambah / Edit Kuis (`/admin/quizzes/[quiz_id]`)

**API**: `POST /admin/quizzes` (create) — update belum tersedia di backend

**Konten:**

**1. Form Info Kuis:**
Komponen `QuizForm.tsx`:

| Field | Type | Validasi |
|-------|------|---------|
| Judul Kuis | text | Wajib |
| Jenis Kuis | select | PRE_ZOO / POST_ZOO / RETENTION_1W / RETENTION_1M |
| Kategori Usia | select | CHILD / TEEN / ADULT |
| Scope | radio | GLOBAL / EXHIBIT |
| Kandang (jika EXHIBIT) | select | Dropdown daftar kandang aktif |

**2. Builder Soal:**
Komponen `QuestionBuilder.tsx`:
- Tombol **"+ Tambah Soal"** → append form soal baru
- Setiap soal berisi:
  - Textarea: teks pertanyaan
  - 4 input: Opsi A, B, C, D
  - Radio: Jawaban benar (A/B/C/D)
  - Bobot poin (default 10)
  - Tombol 🗑️ hapus soal
- Soal bisa di-reorder dengan drag (opsional, bisa tanpa drag dulu)
- Minimal 1 soal wajib ada

**3. Tombol Aksi:**
- **"Simpan Kuis"** → `POST /admin/quizzes` → redirect ke `/admin/quizzes`
- **"Pratinjau"** → buka modal preview tampilan kuis seperti di visitor app
- **"Batal"** → kembali ke `/admin/quizzes`

**State**: `quizForm`, `questions: QuestionDraft[]`, `errors`, `isSubmitting`

```ts
interface QuestionDraft {
  id: string  // UUID lokal untuk key React
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A' | 'B' | 'C' | 'D'
  points: number
}
```

**Validasi:**
- Semua field wajib diisi
- Minimal 1 soal
- Setiap soal wajib punya jawaban benar yang dipilih
- Jika scope EXHIBIT, kandang wajib dipilih

**Catatan:**
- `quiz_id` = `new` untuk mode create
- Mode edit: tampilkan data soal yang sudah ada (saat ini backend belum support UPDATE, jadi mode edit disabled — tampilkan toast: *"Kuis tidak bisa diedit setelah dibuat. Buat kuis baru jika diperlukan."*)
- Komponen `QuestionBuilder` harus support minimal 20 soal tanpa performa terganggu
