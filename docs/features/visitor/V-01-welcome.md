# V-01 — Halaman Selamat Datang (Welcome Page)

## 1. Deskripsi Bisnis & Tujuan Fitur
Halaman Selamat Datang adalah gerbang utama bagi pengunjung kebun binatang yang baru pertama kali melakukan scan QR Code di gerbang masuk. Tujuannya adalah menyambut pengunjung, memperkenalkan konsep edukasi EIS (Educational Impact Score), serta memandu mereka untuk memulai petualangan edukatif mereka dengan mendaftar atau masuk ke sistem.

## 2. Alur Pengguna (User Flow)
1. Pengunjung memindai QR Code gerbang masuk menggunakan kamera bawaan ponsel.
2. Browser memuat rute `/welcome` dan menampilkan visualisasi animasi selamat datang dengan ilustrasi satwa.
3. Pengunjung membaca tagline ringkas tentang petualangan edukatif kebun binatang.
4. **Tombol "Mulai Petualangan"** diklik → Mengarahkan ke halaman registrasi (`/register`).
5. **Link "Masuk di sini"** diklik → Mengarahkan returning visitor ke halaman login (`/login`).

## 3. Spesifikasi Teknis & Rute (Route)
* **Route Path**: `/welcome`
* **Target Device**: Mobile Web (Touch-friendly, optimized max-width `430px`)
* **Layout Shell**: `MobileShell.tsx` (Tanpa BottomNav, tanpa PageHeader)
* **Status Otorisasi**: Public (Dapat diakses tanpa otorisasi/token)

## 4. Struktur Antarmuka (UI Structure) & Komponen Pendukung
Antarmuka dibagi menjadi 2 area utama dalam satu viewport tinggi penuh (`h-screen`):
* **Header Area (Tinggi ± 55% viewport)**:
  * Menggunakan warna latar `bg-primary` (#00652c) sebagai identitas alam kebun binatang.
  * Siluet satwa liar (Gajah & Pohon) tersemat sebagai latar belakang SVG (`aria-hidden="true"`).
  * Judul utama besar bertuliskan "**ZOO**" menggunakan `font-plus-jakarta-sans` dengan tracking ketat.
* **Bottom Content Area**:
  * Menggunakan warna latar `bg-surface-container-lowest` (#ffffff) melengkung ke atas (`-mt-stack-lg rounded-t-xl`) dengan efek bayangan.
  * Judul sambutan dan deskripsi singkat.
  * Tombol CTA utama (Mulai Petualangan) yang melayang melingkar penuh (`rounded-full`) dengan emoji satwa (🦁).
  * Link navigasi ke `/login`.

### Komponen yang Digunakan:
* `MobileShell.tsx` (`src/components/layout/visitor/MobileShell.tsx`): Wrapper viewport mobile.
* `PageTransition.tsx` (`src/components/layout/PageTransition.tsx`): Wrapper animasi transisi halaman.
* `WelcomeHero.tsx` (`src/components/visitor/WelcomeHero.tsx`): Komponen pengatur konten selamat datang & grid tombol.

---

## 5. State Management & Lifecycle
* **Type Rendering**: Client Component (`'use client'` dideklarasikan pada `WelcomeHero.tsx`).
* **State Lokal**: Tidak ada state interaktif selain navigasi bawaan Next.js.
* **State Global / Caching**: Tidak ada pemanggilan data yang perlu disimpan ke cache pada tahapan onboarding ini.

---

## 6. Integrasi API & Payload Data
* **Endpoint Terkait**: Tidak ada. Halaman ini statis sepenuhnya di sisi klien.
* **Service Function**: Tidak ada.

---

## 7. Aturan Bisnis (Business Rules) & Validasi
* **Pencegahan Double Checkout**: Halaman ini mendeteksi jika cookie sinyal otorisasi `eis_auth` aktif, Next.js Middleware akan langsung mengalihkan pengunjung ke `/home` alih-alih menampilkan halaman `/welcome` lagi (kecuali pengguna telah melakukan logout secara sadar).

---

## 8. Ketergantungan (Dependency) & Alur Data Antar Fitur
* Halaman ini bertindak sebagai entri awal (puncak alur navigasi).
* Navigasi selanjutnya mengirimkan pengguna ke `/register` (pengunjung baru) atau `/login` (pengunjung terdaftar).

---

## 9. Penanganan Skenario Batas (Edge Cases)
* **Ketiadaan Sinyal Internet**: Halaman memuat aset lokal SVG, sehingga tetap dapat dimuat dengan baik oleh cache browser offline. Jika navigasi tombol diklik saat offline, browser secara otomatis akan dialihkan ke Error Boundary halaman.

---

## 10. Catatan Pengembangan & Maintenance
* **Animasi**: Menggunakan Framer Motion dengan efek stagger (`staggerContainer` & `staggerItem`) yang dideklarasikan di `src/lib/animations.ts`. Seluruh teks dan elemen masuk perlahan dari bawah menggunakan transisi bernilai durasi `0.4s` dengan easing natural *ease out expo* `[0.16, 1, 0.3, 1]`.
* **Aset**: Ilustrasi siluet satwa terintegrasi langsung dalam bentuk kode inline SVG murni, meminimalkan request jaringan tambahan (HTTP request).
