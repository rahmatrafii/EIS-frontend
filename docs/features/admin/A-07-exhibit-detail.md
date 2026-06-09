# A-07 — Detail & Edit Kandang (Exhibit Detail Page)

## 1. Deskripsi Bisnis & Tujuan Fitur
Halaman Detail & Edit Kandang memfasilitasi Administrator Kebun Binatang untuk mengelola seluruh data relasional yang menempel pada suatu kandang satwa tertentu. Halaman ini menyediakan sistem manajemen terpadu yang dibagi menjadi 5 tab fungsional utama:
* **Info**: Menyunting nama, deskripsi, dan zona dari kandang satwa.
* **Materi Edukasi**: Mengelola materi teks penjelasan edukatif yang disesuaikan untuk tingkat usia pengunjung (CHILD, TEEN, ADULT).
* **Media**: Galeri media pembelajaran (audio, video, infografis, lab interaktif) serta form untuk mengaitkan berkas media baru dengan kategori usia tertentu.
* **QR Code**: Menampilkan kode QR unik untuk kandang tersebut yang terintegrasi dengan opsi cetak dan unduh format gambar (PNG).
* **Statistik**: Menyajikan metrik analitik penting terkait performa kunjungan di kandang tersebut secara riil.

---

## 2. Alur Pengguna (User Flow)
1. Administrator masuk ke menu **Kandang** pada sidebar kiri, lalu memilih salah satu kandang satwa dari daftar tabel.
2. Halaman beralih ke rute `/admin/exhibits/[id]`. Indikator loading skeleton dimunculkan selama pengambilan data database dari backend berlangsung.
3. Setelah data dimuat, Administrator mendarat di **Tab Info** secara default dan dapat melihat status keaktifan kandang (Aktif / Nonaktif).
4. Administrator dapat mengeklik menu navigasi tab untuk berpindah area pengerjaan secara instan (Tab Info, Materi Edukasi, Media, QR Code, dan Statistik).
5. Pada Tab **Materi Edukasi**, Administrator dapat membuka accordion kategori umur dan mengisi/memperbarui konten teks melalui form editor terintegrasi.
6. Pada Tab **Media**, Administrator dapat meninjau galeri berkas yang ada serta menambahkan file baru ke sistem.
7. Pada Tab **QR Code**, Administrator dapat langsung mengunduh gambar QR Code untuk dicetak secara fisik di kebun binatang.

---

## 3. Spesifikasi Teknis & Rute (Route)
* **Route Path**: `/admin/exhibits/[id]`
* **Target Device**: Desktop Browser (min-width `1024px`)
* **Layout Shell**: `AdminShell.tsx` (dilengkapi dengan Sidebar navigasi kiri dan Topbar breadcrumb)
* **Status Otorisasi**: Terproteksi (Hanya dapat diakses oleh Admin terotentikasi)

---

## 4. Struktur Antarmuka (UI Structure) & Komponen Pendukung
* **Breadcrumb**: Menampilkan navigasi hierarkis `Dashboard -> Kandang -> [Nama Kandang]` untuk memudahkan penjelajahan balik.
* **Header Area**: Berisi judul nama kandang, badge status `Aktif/Nonaktif`, zona kandang, serta tombol "Kembali".
* **Tab Navigasi**: Tab bar horizontal dengan micro-animation hover dan indikator garis bawah warna primer saat aktif.
* **Tab Info Panel**: Berisi input teks nama kandang, dropdown zona (dilengkapi field custom zona jika memilih 'Lainnya'), textarea deskripsi panjang, serta tombol submit.
* **Tab Materi Panel**: Daftar accordion 3 kategori usia dengan indikator label status `✅ Ada Konten` / `❌ Belum Ada`.
* **Tab Media Panel**: Terbagi atas dua kolom, form pengunggah berkas (`MediaUploader.tsx`) di sebelah kiri, dan galeri kartu media interaktif di sebelah kanan.
* **Tab QR Code Panel**: Memuat kanvas render QR Code, identifikasi kode unik monospaced, tombol "Unduh QR Code", serta papan peringatan petunjuk instalasi fisik.
* **Tab Statistik Panel**: Baris kartu data angka statis (total kunjungan, rata-rata durasi, jenis media terpopuler, peningkatan EIS) dan area visualisasi tren pengunjung.

### Komponen yang Digunakan:
* `ExhibitDetailContent.tsx` (`src/app/(admin)/admin/exhibits/[id]/ExhibitDetailContent.tsx`): Komponen pengatur utama rendering halaman detail dan router navigasi tab.
* `ContentEditor.tsx` (`src/components/admin/ContentEditor.tsx`): Form penyunting judul dan isi teks materi edukasi per kategori umur.
* `MediaUploader.tsx` (`src/components/admin/MediaUploader.tsx`): Komponen upload media ke cloud storage.
* `qrcode.react`: Library visualisasi QR Code berbasis canvas HTML5.

---

## 5. State Management & Lifecycle
* **Type Rendering**: Client Component (`'use client'`).
* **State Manager (Custom Hook)**: Menggunakan custom hook `useAdminExhibitDetail` (`src/hooks/admin/useAdminExhibitDetail.ts`) untuk mengelola:
  * `exhibit`: Data detail kandang terintegrasi.
  * `isLoading`: Status pemuatan awal API.
  * `error`: Log pesan kegagalan transaksi jaringan.
  * `activeTab`: Penunjuk ID tab yang sedang aktif di layar.
  * `isSavingInfo`, `isSavingContent`, `isDeletingContent`, `isDeletingMedia`: Status transaksi mutasi data.

---

## 6. Integrasi API & Payload Data
Fitur ini memanggil API backend untuk mendapatkan detail data relasional lengkap:
* **Detail Kandang**: `GET /api/v1/admin/exhibits/:id`
  * Service: `getAdminExhibitDetail(exhibitId)`
  * Parameter: `exhibitId` (number)
  * Helper: `apiRequest<AdminExhibitDetail>(API.admin.exhibitById(String(exhibitId)))`

---

## 7. Aturan Bisnis (Business Rules) & Validasi
* **Pemuatan Relasi Utuh**: Response dari pemanggilan API wajib menyertakan detail data relasi materi edukasi (`learningContent`) dan galeri media (`media`) beserta kalkulasi statistik riil agar seluruh panel tab terisi data asli dari database PostgreSQL.
* **Validasi Peran Pengguna**: Jika sesi login admin kedaluwarsa atau peran pengguna berubah menjadi non-admin, browser langsung mengarahkan pengguna kembali ke `/admin/login` untuk mencegah kebocoran data operasional.

---

## 8. Ketergantungan (Dependency) & Alur Data Antar Fitur
* **QR Canvas Generator**: Menggunakan `QRCodeCanvas` untuk menggambar nilai `qr_code_identifier` secara langsung di sisi klien dengan tingkat koreksi kesalahan (Error Correction Level) bertipe `'H'` (High) agar tetap mudah dipindai meskipun permukaan cetak mengalami goresan fisik minor.
* **API Endpoints Map**: Ketergantungan terhadap konstanta `API.admin.exhibitById` untuk penyediaan konstruksi URL API yang dinamis.

---

## 9. Penanganan Skenario Batas (Edge Cases)
* **ID Kandang Tidak Ditemukan**: Jika data kandang yang diminta bernilai kosong atau dihapus, aplikasi menampilkan komponen halaman eror khusus yang disertai pesan instruktif dan tombol navigasi jalan pintas untuk kembali ke `/admin/exhibits`.
* **Ketiadaan Data Relasional**: Jika kandang belum memiliki materi edukasi atau berkas media sama sekali, sistem menampilkan state kosong yang ramah dengan panduan instruksi untuk mulai menambahkan konten baru.

---

## 10. Catatan Pengembangan & Maintenance
* **Skeleton Loaders**: Pemuatan halaman menggunakan skeleton loading modern guna memberikan kepastian visual kepada pengguna selama transaksi API backend sedang berlangsung.
* **Format Penamaan Atribut**: Respons data dari backend dipetakan secara tepat ke tipe data TypeScript di frontend (`AdminExhibitDetail`) untuk menjamin konsistensi penamaan variabel (seperti `zone_name`, `created_at`, `content_status`).
