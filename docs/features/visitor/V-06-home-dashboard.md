# V-06 — Halaman Home Dashboard (Home / Dashboard Pengunjung)

## 1. Deskripsi Bisnis & Tujuan Fitur
Halaman Home Dashboard adalah pusat komando utama bagi pengunjung selama petualangan mereka di kebun binatang. Tujuannya adalah membantu pengunjung melacak durasi kunjungan aktif mereka secara real-time, memberikan akses instan untuk melakukan pemindaian QR Code di depan kandang satwa, memantau kemajuan kunjungan (jumlah kandang yang dikunjungi), serta melihat pencapaian akademis awal (pre-test) dan status kuis lanjutan (retensi) yang dijadwalkan pada hari-hari berikutnya.

## 2. Alur Pengguna (User Flow)
1. Pengunjung berhasil masuk atau memverifikasi email melalui OTP, lalu dialihkan ke halaman dashboard `/home`.
2. Halaman memuat profil pengunjung dan mendeteksi atau menginisialisasi sesi kunjungan fisik kebun binatang yang aktif.
3. Pengunjung melihat sambutan personal ("Halo, Rahmat! 👋") dan timer digital real-time yang menunjukkan durasi kunjungan mereka saat ini (misalnya: `00:35:12` sejak check-in).
4. Pengunjung dapat mengeklik tombol utama **"Scan Kandang Satwa"** untuk membuka kamera pemindai QR Code (`/scan`).
5. Pengunjung memantau progress petualangan mereka:
   * Melihat kartu-kartu kandang satwa yang baru saja mereka kunjungi beserta durasi waktu belajar di kandang tersebut (misalnya: 🐅 Harimau Sumatera, 🐘 Gajah Sumatra).
   * Memantau performa pemahaman satwa liar mereka melalui persentase grafik nilai kuis pengetahuan awal (pre-test).
   * Memeriksa status kuis lanjutan (Kuis Retensi H+7 dan H+30) untuk melacak jadwal kuis edukasi pasca-kunjungan.

## 3. Spesifikasi Teknis & Rute (Route)
* **Route Path**: `/home`
* **Target Device**: Mobile Web (Touch-friendly, optimized max-width `430px`)
* **Layout Shell**: `MobileShell.tsx` dengan integrasi `BottomNav.tsx`
* **Status Otorisasi**: Protected / Private (Memerlukan token otentikasi JWT yang valid)

## 4. Struktur Antarmuka (UI Structure) & Komponen Pendukung
Antarmuka didesain secara premium dengan elemen berlapis dan transisi halus:
* **Header / Greeting Area (Warna Latar Gradien dari `bg-primary` ke `bg-primary-container`)**:
  * Judul aplikasi "**ZOO**" dan tombol notifikasi bell di sudut kanan atas.
  * Teks sambutan personal besar menggunakan `font-plus-jakarta-sans` tebal.
  * Komponen **SessionTimer** yang menampilkan status sesi aktif dan jam check-in pengunjung.
* **Scan QR Card (Tumpang Tindih / Overlap Card)**:
  * Memiliki latar belakang putih bersih (`bg-surface-container-lowest`) dengan bayangan halus.
  * Ikon pemindai besar dan tombol utama "Buka Kamera" yang melingkar penuh (`rounded-full`).
* **Main Content Area (Scrollable)**:
  * **Kandang Dikunjungi**: Menampilkan daftar kandang dengan emoji satwa, nama kandang, zona, jam kunjungan, serta tag durasi waktu belajar.
  * **Skor Pre-Test**: Menampilkan persentase pencapaian pre-test menggunakan bar progres horizontal dan dekorasi emblem kelulusan (`school`) transparan.
  * **Kuis Lanjutan**: Grid 2 kolom yang menampung kartu status kuis retensi H+7 dan H+30.

### Komponen yang Digunakan:
* `MobileShell.tsx` (`src/components/layout/visitor/MobileShell.tsx`): Wrapper viewport mobile.
* `PageTransition.tsx` (`src/components/layout/PageTransition.tsx`): Wrapper animasi transisi halaman.
* `BottomNav.tsx` (`src/components/layout/visitor/BottomNav.tsx`): Navigasi tab bar bawah mobile (Home, Progress, Profile).
* `SessionTimer.tsx` (`src/components/visitor/SessionTimer.tsx`): Penghitung durasi kunjungan real-time sejak check-in.
* `RetentionStatusCard.tsx` (`src/components/visitor/RetentionStatusCard.tsx`): Kartu visualisasi status kuis retensi H+7 & H+30.

---

## 5. State Management & Lifecycle
* **Type Rendering**: Campuran Server Component (`page.tsx`) dan Client Component (`HomeContent.tsx` dengan `'use client'`).
* **State Lokal**:
  * `profile`: Informasi profil pengguna dari API.
  * `activeSession`: Informasi sesi kunjungan aktif saat ini.
  * `analytics`: Data kemajuan kandang dan skor pre-test.
  * `retention`: Status kuis retensi lanjutan.
  * `isLoadingData`: Menangani tampilan skeleton ketika data sedang diambil secara paralel.
  * `errorMsg`: Menangani pesan kesalahan saat server bermasalah.
* **State Global / Caching**: Menggunakan hook custom `useSession` untuk menginisialisasi atau memuat ulang ID sesi yang disimpan di `sessionStorage`.

---

## 6. Integrasi API & Payload Data
Halaman ini melakukan pengambilan data secara paralel (parallel fetching) menggunakan service async murni:
* **Profil Pengguna**: `getUserProfile()` memanggil `GET /users/profile`.
* **Riwayat Sesi**: `getSessionHistory()` memanggil `GET /sessions/history` untuk mencocokkan sesi aktif dan jam check-in.
* **Analitik Sesi**: `getSessionAnalytics(sessionId)` memanggil `GET /analytics/session/{sessionId}` untuk mendapatkan daftar kandang satwa yang dikunjungi dan nilai pre-test.
* **Status Retensi**: `getRetentionStatus()` memanggil `GET /quizzes/retention-status` untuk melacak status kuis lanjutan H+7 & H+30.

---

## 7. Aturan Bisnis (Business Rules) & Validasi
* **Proteksi Akses**: Jika pengguna tidak memiliki token JWT atau cookie otentikasi `eis_auth` aktif, middleware server secara otomatis akan menolak akses ke `/home` dan mengalihkan pengguna kembali ke `/welcome`.
* **Kondisi Kuis Retensi**: Status retensi kuis dipetakan secara dinamis:
  * `PENDING` -> Belum dikirim / status tunggu.
  * `SENT` -> Email kuis terkirim, siap dikerjakan.
  * `COMPLETED` -> Selesai diselesaikan.
  * `EXPIRED` -> Batas waktu pengerjaan habis.
  * `LOCKED` -> Kuis terkunci (misalnya H+30 saat status masih di hari-hari awal).

---

## 8. Ketergantungan (Dependency) & Alur Data Antar Fitur
* Ketergantungan utama adalah adanya **Sesi Aktif** yang dihasilkan setelah pre-zoo test selesai dikerjakan (`ROUTES.quiz.preZoo`).
* Navigasi selanjutnya mengarahkan pengguna ke fitur kamera scan (`ROUTES.scan`) untuk memicu interaksi kandang satwa baru.

---

## 9. Penanganan Skenario Batas (Edge Cases)
* **Ketiadaan Sesi di Database**: Jika pengunjung mengakses rute `/home` tanpa memiliki sesi terdaftar, hook `useSession` secara otomatis meluncurkan pemanggilan API `startSession` untuk membuat sesi baru agar pengunjung tidak mengalami macet.
* **Kegagalan API (Offline Fallbacks)**: Komponen dilengkapi dengan data tiruan (fallback mock data) yang sangat presisi. Jika backend API tidak dapat dihubungi, sistem gagal secara senyap (fail-silent) dan menampilkan data prototipe standard (seperti progres 🐅 Harimau dan 🐘 Gajah) sehingga antarmuka tetap menyajikan visualisasi 100% sempurna tanpa merusak pengalaman estetis pengguna.
* **Synchronous State Rendering (ESLint Safety)**: Eksekusi inisialisasi diletakkan di dalam microtask aman (`setTimeout 0ms`) untuk mencegah render bertingkat (cascading renders) yang dilarang oleh aturan linter React 19 / ESLint.

---

## 10. Catatan Pengembangan & Maintenance
* **Animasi & Transisi**: Menggunakan pembungkus `<PageTransition />` dengan variant Framer Motion `fadeIn` untuk memberikan kesan perpindahan halaman yang halus, elegan, dan premium.
* **SEO & Metadata**: Metadata halaman dikonfigurasi secara statis pada file Server Component `page.tsx` untuk memastikan indeks pencarian search engine (SEO) berjalan secara optimal sesuai standar regulasi web modern.
