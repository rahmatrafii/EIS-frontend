# SOP-13 — Spesifikasi Halaman Visitor App (18 Halaman)

> **Konteks**: Semua halaman visitor adalah **Mobile Web** (max-width 430px). Baca **SOP-15** untuk panduan layout mobile sebelum mengerjakan halaman apapun di sini.

---

## V-01 — Halaman Selamat Datang (`/welcome`)

**Trigger**: Muncul saat pengunjung baru pertama kali scan QR gerbang kebun binatang.

**Konten:**
- Logo ZOO (gambar/SVG dari `public/images/logo.svg`)
- Tagline singkat: *"Jelajahi, Pelajari, dan Ukur Dampak Edukasi Kunjunganmu"*
- Ilustrasi/animasi sederhana (bisa SVG satwa)
- Tombol **"Mulai Petualangan"** → `/register`
- Teks kecil: *"Sudah pernah daftar? Login di sini"* → `/login`

**State**: Tidak ada fetch. Halaman ini statis sepenuhnya.

**Komponen**: `WelcomeHero.tsx`

**Catatan:**
- Gunakan animasi Framer Motion `fadeInUp` untuk elemen hero
- Background bisa menggunakan pola/warna alam (hijau/emerald)
- Tidak ada navbar/header

---

## V-02 — Halaman Registrasi (`/register`)

**API**: `POST /users/register`

**Form Fields:**
| Field | Type | Validasi |
|-------|------|---------|
| Nama Lengkap | text | Wajib, min 2 karakter |
| Email | email | Wajib, format email valid |
| Tanggal Lahir | date | Wajib, tidak boleh masa depan, max 100 tahun lalu |

**Flow setelah submit sukses:**
1. Backend buat user → kirim OTP ke email
2. Simpan `email` ke `sessionStorage` (untuk dipakai di halaman OTP)
3. Redirect ke `/verify-otp`

**State**: `isSubmitting`, `errors` (per field), toast error untuk error umum server

**Komponen**: `RegisterForm.tsx`

**Catatan:**
- Field tanggal lahir pakai `<input type="date">` — jangan custom date picker
- Tampilkan helper text: *"OTP akan dikirim ke email ini"* di bawah field email
- Ada link kembali ke `/welcome`

---

## V-03 — Halaman Verifikasi OTP (`/verify-otp`)

**API**: `POST /users/verify-otp` → `POST /users/request-otp` (resend)

**Konten:**
- Teks: *"Kode verifikasi dikirim ke [email]"* (email diambil dari `sessionStorage`)
- Input OTP: 6 kotak digit terpisah (komponen `OtpInput.tsx`)
- Tombol **"Verifikasi"**
- Countdown 60 detik, setelah habis → tombol **"Kirim Ulang OTP"** aktif
- Komponen `OtpCountdown.tsx` untuk timer visual

**Flow setelah verifikasi sukses:**
1. Simpan JWT token (`saveToken(token)`)
2. Set cookie sinyal auth (`eis_auth`, `eis_role`)
3. Redirect → `/quiz/pre-zoo` (wajib kerjakan pre-test dulu)

**State**: `otp` (string 6 digit), `countdown` (number), `isVerifying`, `isResending`, `error`

**Catatan:**
- Jika email tidak ada di `sessionStorage`, redirect ke `/register`
- Countdown restart setelah resend berhasil
- Kirim ulang OTP hanya bisa jika countdown = 0

---

## V-04 — Halaman Login (`/login`)

**API**: `POST /users/request-otp` → `POST /users/verify-otp`

**Dua Langkah dalam satu halaman:**

Step 1 — Email:
- Input email
- Tombol **"Kirim OTP"**
- Link: *"Belum punya akun? Daftar"* → `/register`

Step 2 — OTP (muncul setelah email berhasil kirim OTP):
- Tampilkan email yang dipakai
- `OtpInput` 6 digit
- Countdown + tombol resend
- Tombol **"Masuk"**

**Flow setelah login sukses:**
- Cek apakah user pernah menyelesaikan pre-test di sesi ini:
  - Belum → redirect ke `/quiz/pre-zoo`
  - Sudah → redirect ke `/home`

**State**: `step: 'email' | 'otp'`, `email`, `otp`, `countdown`, `isLoading`, `error`

---

## V-05 — Halaman Pre-Test (`/quiz/pre-zoo`)

**API**: `GET /quizzes/fetch?type=PRE_ZOO&session_id={id}` → `POST /quizzes/submit`

**Flow:**
1. Halaman load → panggil `POST /sessions/start` terlebih dahulu untuk buat sesi
2. Simpan `session_id` aktif ke `sessionStorage`
3. Fetch soal pre-test
4. Tampilkan soal satu per satu
5. Submit semua jawaban → redirect ke `/home`

**Konten:**
- Header: "Pre-Test" + progress bar (Soal X dari Y)
- Satu soal per tampilan (bukan scroll)
- 4 pilihan jawaban (A, B, C, D) sebagai tombol besar touch-friendly
- Tombol **"Selanjutnya"** → soal berikutnya
- Soal terakhir: tombol **"Selesai & Mulai Petualangan"**

**State**: `questions`, `currentIndex`, `answers` (map questionId → answer), `isSubmitting`, `isLoading`, `error`

**Komponen**: `QuizCard.tsx`, `QuizProgress.tsx`, `QuizOption.tsx`

**Catatan:**
- Tidak bisa skip soal — harus pilih jawaban sebelum lanjut
- Tidak bisa kembali ke soal sebelumnya (linear flow)
- Animasi `fadeInRight` saat pindah soal
- Jika session sudah ada di sessionStorage → langsung fetch quiz (jangan start session lagi)

---

## V-06 — Home / Dashboard Pengunjung (`/home`)

**API**: `GET /users/profile`, `GET /quizzes/retention-status`

**Konten:**
- Greeting: *"Halo, [Nama]! 👋"*
- Info sesi aktif: waktu mulai + session timer (komponen `SessionTimer.tsx`)
- **Tombol utama besar**: "📷 Scan QR Kandang" → `/scan`
- **Kartu Retensi** (jika sesi sudah selesai sebelumnya):
  - Badge status kuis H+7 dan H+30
  - Komponen `RetentionStatusCard.tsx`
- Link ke `/profile`

**State**: `user`, `retentionStatus`, `isLoading`

**Catatan:**
- Ini adalah "home base" selama kunjungan — desain harus terasa hangat dan mudah
- Tombol Scan QR harus paling menonjol (CTA utama)
- `SessionTimer` menampilkan waktu berlalu sejak sesi dimulai (format `mm:ss`)

---

## V-07 — Halaman Scan QR (`/scan`)

**API**: `POST /track/checkin`

**Konten:**
- Viewport kamera penuh (gunakan `getUserMedia` via `useQrScanner.ts`)
- Overlay frame persegi di tengah layar sebagai "target scan"
- Teks panduan: *"Arahkan kamera ke QR Code kandang"*
- Tombol tutup/kembali (X) → `/home`
- State setelah scan berhasil: loading brief → redirect ke `/exhibit/[exhibit_id]`

**Hook**: `useQrScanner.ts` — menggunakan `jsQR` atau library decode QR

**State**: `isScanning`, `error`, `result`

**Catatan:**
- Minta permission kamera saat halaman load
- Jika permission ditolak: tampilkan instruksi mengaktifkan kamera + tombol coba lagi
- Jika QR code tidak dikenali sistem (exhibit tidak ditemukan): tampilkan toast error, kembali scanning
- Tidak ada navigasi bottom saat di halaman ini (fullscreen camera)

**Package tambahan yang perlu diinstall**: `jsqr` atau `qr-scanner`

---

## V-08 — Halaman Kandang (`/exhibit/[exhibit_id]`)

**API**: Tidak ada fetch baru — data exhibit sudah ada dari response checkin di `/scan`
Data diteruskan via `sessionStorage` key `eis_current_exhibit`

**Konten:**
- Header: nama satwa + tombol back → `/home`
- Hero image satwa (dari `exhibit.image_url` jika ada)
- Deskripsi singkat satwa
- **Materi teks edukasi** — diambil dari `LearningPathContent` sesuai kategori umur user
- **Grid 4 tombol media** (`MediaGrid.tsx`):
  - 🔊 Audio → `/exhibit/[id]/audio`
  - 🎥 Video → `/exhibit/[id]/video`
  - 🖼️ Infografis → `/exhibit/[id]/infographic`
  - 🧪 Interactive Lab → `/exhibit/[id]/lab`

**API saat klik tombol media**: `PATCH /track/interact` → catat jenis media yang diklik

**State**: Data diambil dari sessionStorage, tidak perlu fetch ulang

**Catatan:**
- Halaman ini harus bisa scroll (konten teks bisa panjang)
- Setiap tombol media langsung catat interaksi via `PATCH /track/interact` sebelum navigate
- Kategori umur dihitung dari `user.birth_date` menggunakan `src/lib/age.ts`

---

## V-09 — Halaman Audio Player (`/exhibit/[exhibit_id]/audio`)

**API**: `PATCH /track/interact` (catat interaksi)

**Konten:**
- Header: nama satwa + tombol back
- Ilustrasi/avatar satwa beranimasi saat audio play (pulse atau gelombang suara)
- Player kontrol: Play/Pause, progress bar, timestamp (mm:ss / mm:ss)
- Judul audio: *"Suara [Nama Satwa]"*

**Hook**: `useMediaPlayer.ts` — state: `isPlaying`, `currentTime`, `duration`, `progress`

**Catatan:**
- Gunakan HTML `<audio>` native — jangan library audio berat
- Animasi visualisasi suara: lingkaran pulse menggunakan Framer Motion saat `isPlaying`
- Catat interaksi saat user pertama kali menekan Play (bukan saat halaman load)

---

## V-10 — Halaman Video Player (`/exhibit/[exhibit_id]/video`)

**API**: `PATCH /track/interact`

**Konten:**
- Header: nama satwa + tombol back
- Video player fullwidth
- Kontrol: Play/Pause, progress bar, fullscreen button
- Judul video

**Catatan:**
- Gunakan HTML `<video>` native dengan kontrol custom (bukan browser default)
- `object-fit: cover` untuk video landscape di layar portrait
- Catat interaksi saat pertama Play

---

## V-11 — Halaman Infografis (`/exhibit/[exhibit_id]/infographic`)

**API**: `PATCH /track/interact`

**Konten:**
- Header tipis + tombol back
- Gambar infografis full-width, bisa di-pinch zoom (pakai `touch-action: pan-x pan-y` + `overflow: auto`)
- Teks caption di bawah gambar

**Catatan:**
- Gambar dari URL Cloudinary (sudah dioptimasi)
- Gunakan `<img>` biasa (bukan `next/image`) karena URL dinamis dari API
- Catat interaksi saat gambar pertama kali ditampilkan (on mount)

---

## V-12 — Halaman Interactive Lab (`/exhibit/[exhibit_id]/lab`)

**API**: `PATCH /track/interact`, `POST /track/lab-log`

**Konten:**
- Header: *"🧪 Lab Interaktif — [Nama Satwa]"* + tombol back
- Area game (lihat catatan)
- Skor realtime selama game
- Tombol **"Selesai"** → submit skor via `POST /track/lab-log` → kembali ke halaman kandang

**State**: `score`, `isCompleted`, `isSubmitting`

**Catatan tentang game template:**
- Template game yang SAMA untuk semua satwa, konten berbeda
- Pilih satu mekanisme game sederhana: **Matching/Drag** (pasangkan fakta satwa ke gambar) ATAU **True/False cepat** (10 pertanyaan, jawab sebelum timer habis)
- Tingkat kesulitan dikontrol dari data konten backend, bukan dari kode frontend
- Buat komponen `InteractiveLab.tsx` yang reusable — terima props: `questions[]`, `onComplete(score)`
- Submit lab log dilakukan satu kali saat game selesai (bukan per jawaban)

---

## V-13 — Halaman Post-Test (`/quiz/post-zoo`)

**API**: `GET /quizzes/fetch?type=POST_ZOO&session_id={id}` → `POST /quizzes/submit` → `POST /sessions/end`

**Flow:**
1. Fetch soal post-test (berdasarkan kandang yang dikunjungi)
2. Tampilkan soal (sama persis dengan Pre-Test: satu per satu, linear)
3. Submit jawaban
4. Panggil `POST /sessions/end` untuk mengakhiri sesi
5. Redirect ke `/visit-result`

**Catatan:**
- Muncul saat user scan QR pintu keluar (trigger dari `/scan` yang mendeteksi QR pintu keluar)
- Atau bisa diakses manual dari `/home` jika ada tombol "Akhiri Kunjungan"
- Soal disesuaikan dengan kandang yang dikunjungi (dihandle backend)

---

## V-14 — Halaman Hasil Kunjungan (`/visit-result`)

**API**: `GET /analytics/session/{session_id}`, `GET /quizzes/result/{session_id}`

**Konten:**
- 🎉 Animasi celebrasi (confetti atau emoji besar)
- **Knowledge Gain**: perbandingan skor pre-test vs post-test (progress bar animasi)
- **Kandang Dikunjungi**: list nama kandang + durasi
- **Media yang Dipakai**: icon + jumlah per tipe (audio/video/infografis/lab)
- **EIS Score Sementara**: angka besar + label *"(Score final tersedia setelah kuis retensi)"*
- Tombol **"Lihat Score Detail"** → `/score`
- Tombol **"Kembali ke Beranda"** → `/home`

**Komponen**: `VisitSummaryCard.tsx`

**Catatan:**
- Halaman ini boleh scroll panjang — ini adalah "hasil kerja" pengunjung
- Animasi `staggerContainer` + `staggerItem` untuk setiap kartu statistik
- EIS Score di sini adalah kalkulasi awal (tanpa retensi)

---

## V-15 — Halaman EIS Score (`/score`)

**API**: `GET /analytics/eis/{user_id}`

**Konten:**
- **Grade besar** di atas (A/B/C/D atau label: Sangat Tinggi/Tinggi/Sedang/Rendah)
- `EisGradeBadge.tsx` — badge bergaya dengan warna sesuai grade
- **Total Score**: angka besar dengan animasi count-up
- **Breakdown 3 komponen**:
  - Knowledge Gain Score → progress bar + nilai
  - Engagement Score → progress bar + nilai
  - Retention Score → progress bar + nilai (abu-abu jika belum ada retensi)
- Kalimat motivasi sesuai grade
- Tombol **"Bagikan"** (native share API jika tersedia)
- Tombol **"Kembali ke Profil"** → `/profile`

**Komponen**: `EisScoreDisplay.tsx`, `EisGradeBadge.tsx`

**Catatan:**
- Animasi progress bar semua komponen muncul berurutan (stagger delay)
- Count-up animation untuk angka total score (0 → nilai akhir dalam 1.5 detik)
- Gunakan Framer Motion untuk progress bar (lihat SOP-09)

---

## V-16 — Halaman Profil (`/profile`)

**API**: `GET /users/profile`, `GET /sessions/history`

**Konten:**
- Avatar inisial nama (lingkaran dengan huruf pertama nama)
- Nama lengkap + email + kategori umur
- **Riwayat Kunjungan**: list kartu per sesi (tanggal, durasi, EIS Score) → tap → `/score?session_id={id}`
- **Tombol Status Retensi** → `/profile/retention-status`
- Tombol **"Keluar"** (logout)

**State**: `user`, `sessionHistory`, `isLoading`

---

## V-17 — Halaman Retention Quiz (`/retention/[token]`)

**API**: `GET /retention/quiz/{token}` → `POST /retention/submit/{token}`

**Konten**: Sama persis dengan halaman kuis biasa (Pre/Post-Test) — satu soal per layar, pilihan A-D, progress bar, tombol selesai

**Flow:**
1. Load → fetch kuis via token (public, tidak perlu auth)
2. Token tidak valid → halaman error informatif: *"Link kuis tidak valid atau sudah kadaluarsa"*
3. Token sudah dipakai → *"Anda sudah mengerjakan kuis retensi ini"*
4. Submit → tampilkan halaman sukses sederhana: *"Terima kasih! Score Anda telah diperbarui"*

**Catatan:**
- Halaman ini **tidak** ada di layout visitor (tidak ada bottom nav, tidak ada header)
- Fully standalone — bisa dibuka tanpa login
- Gunakan layout minimal: hanya logo kecil di atas + konten

---

## V-18 — Halaman Status Retensi (`/profile/retention-status`)

**API**: `GET /quizzes/retention-status`

**Konten:**
- Header: *"Kuis Retensi"* + tombol back
- **Kartu H+7**:
  - Status: `Pending` / `Terkirim` / `Selesai` / `Kadaluarsa`
  - Tanggal pengiriman email (jika sudah terkirim)
  - Badge warna sesuai status
- **Kartu H+30** (sama strukturnya)
- Penjelasan singkat: *"Kuis retensi dikirim via email untuk mengukur seberapa lama ilmu yang kamu dapat bertahan"*

**Komponen**: `RetentionStatusCard.tsx`

**Status badge mapping:**
| Status Backend | Label UI | Warna |
|---|---|---|
| `PENDING` | Belum Terkirim | Abu-abu |
| `SENT` | Email Terkirim | Biru |
| `COMPLETED` | Selesai ✓ | Hijau |
| `EXPIRED` | Kadaluarsa | Merah |
