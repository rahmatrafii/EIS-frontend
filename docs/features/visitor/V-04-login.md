# V-04 — Halaman Login (Login Page)

## 1. Deskripsi Bisnis & Tujuan Fitur
Halaman Login memfasilitasi masuknya kembali pengunjung terdaftar (returning visitors) ke dalam aplikasi. Sistem mengidentifikasi pengguna lewat alamat email mereka tanpa memerlukan kata sandi rumit (passwordless), kemudian memicu verifikasi OTP 6 digit yang dikirim ke email tersebut untuk memvalidasi kepemilikan akun sebelum mengaktifkan kembali riwayat sesi atau skor EIS pengunjung.

## 2. Alur Pengguna (User Flow)
Halaman ini menyatukan dua langkah transisi antarmuka yang mulus tanpa memuat ulang rute browser:

### Langkah 1: Input Alamat Email
1. Pengunjung menekan link **"Masuk di sini"** dari landing page `/welcome` atau `/register`.
2. Halaman memuat form input email tunggal.
3. Pengunjung mengetik alamat email terdaftar dan menekan tombol **"Kirim OTP"**.
4. Jika email valid dan terdaftar, aplikasi berpindah ke Langkah 2.

### Langkah 2: Verifikasi OTP
1. Bagian input email disembunyikan / dikunci, kemudian memunculkan baris input OTP 6-kolom (`OtpInput.tsx`).
2. Teks petunjuk dinamis muncul: *"OTP dikirim ke [email_pengunjung]"*.
3. Pengunjung mengetikkan 6 digit OTP.
4. Pengunjung menekan tombol **"Masuk"**.
5. Jika verifikasi sukses:
   * Token disimpan dan cookie disematkan.
   * Aplikasi memeriksa status kuis pra-kunjungan. Jika belum pernah pre-test di hari kunjungan aktif → alihkan ke `/quiz/pre-zoo`. Jika sudah pernah menyelesaikan pre-test → alihkan ke `/home`.

## 3. Spesifikasi Teknis & Rute (Route)
* **Route Path**: `/login`
* **Target Device**: Mobile Web (max-width `430px`)
* **Layout Shell**: `(auth)/layout.tsx` (centered container layout, no navbar)
* **Status Otorisasi**: Public

## 4. Struktur Antarmuka (UI Structure) & Komponen Pendukung
* **Header**: Judul sambutan dinamis ("Selamat Datang Kembali") + sub-judul penunjuk instruksi.
* **Form Shell**:
  * **Kondisi `step === 'email'`**:
    * Input Email (`Input.tsx`) dengan ikon surat.
    * Tombol CTA "Kirim Kode Verifikasi" (`Button.tsx`).
    * Link navigasi kaki: *"Belum punya akun? Daftar"* → `/register`.
  * **Kondisi `step === 'otp'`**:
    * Label email terkunci (disabled) untuk konfirmasi visual.
    * Input OTP 6-kolom (`OtpInput.tsx`).
    * Penghitung mundur visual (`OtpCountdown.tsx`).
    * Tombol CTA "Masuk & Mulai Kunjungan".
    * Link navigasi kaki: *"Salah email? Kembali"* untuk mereset step ke `'email'`.

### Komponen yang Digunakan:
* `LoginForm.tsx` (`src/components/auth/LoginForm.tsx`): Komponen pengendali logika transisi step, OTP, dan submit.
* `Input.tsx` & `OtpInput.tsx`: Primitif input ter-control.
* `Button.tsx`: Tombol aksi ber-spinner.

---

## 5. State Management & Lifecycle
* **Type Rendering**: Client Component (`'use client'`).
* **State Lokal**:
  * `step`: String state penunjuk layar aktif (`'email' | 'otp'`).
  * `email`: String nilai email terkontrol.
  * `otp`: String 6-digit OTP terkontrol.
  * `countdown`: Integer waktu hitung mundur resend OTP (60s).
  * `isLoading`: Boolean status tunggu integrasi API.
  * `error`: String pesan kesalahan sistem.

---

## 6. Integrasi API & Payload Data
Menggunakan gabungan 2 API secara berurutan:
1. **Request OTP**: `POST /users/request-otp`
   * Service: `requestOtp(email)`
   * Payload: `{ email }`
2. **Verify OTP**: `POST /users/verify-otp`
   * Service: `verifyOtp({ email, otp })`
   * Payload: `{ email, otp }`

* **Response Sukses Verifikasi**:
  Mengembalikan objek yang berisi token sesi JWT dan data profil lengkap pengguna (untuk disimpan di `AuthContext` global).

---

## 7. Aturan Bisnis (Business Rules) & Validasi
* **Pencegahan Akun Bodong**: Jika alamat email belum terdaftar di sistem kebun binatang, API `/users/request-otp` akan merespons dengan eror (mis. "Email tidak ditemukan"). Aplikasi akan menampilkan eror tersebut di bawah field input email dan melarang transisi ke step OTP.
* **Verifikasi Pre-Test Sesi**:
  Setelah login berhasil, sistem wajib memeriksa apakah ada sesi kunjungan aktif di hari tersebut yang telah menyelesaikan pre-test. Pemeriksaan ini penting untuk memastikan tidak ada pengunjung melewati fase pre-test (yang merusak validitas skor dampak edukasi EIS).

---

## 8. Ketergantungan (Dependency) & Alur Data Antar Fitur
* **Session Storage**: Alamat email disimpan sementara di `sessionStorage` sebagai `eis_login_email` untuk keperluan pengiriman ulang OTP (*resend request*).
* **Token Storage**: JWT disimpan secara lokal (`saveToken(token)`) jika verifikasi OTP Langkah 2 selesai dengan status sukses.

---

## 9. Penanganan Skenario Batas (Edge Cases)
* **Pengunjung Salah Mengetik Email**: Pada langkah verifikasi OTP, sistem menyediakan tombol "Kembali" yang akan mengembalikan state `step` ke `'email'`, membersihkan input OTP, dan mengizinkan koreksi alamat email tanpa harus me-refresh halaman web secara keseluruhan.
* **Resend Bertubi-tubi**: Countdown timer 60 detik mencegah penumpukan request resend OTP ke server.

---

## 10. Catatan Pengembangan & Maintenance
* **Animasi Transisi Step**: Transisi antara form email dan form OTP didesain dengan animasi transisi geser horizontal halus menggunakan Framer Motion `fadeInRight` (`exit` ke kiri, `enter` dari kanan) agar antarmuka terasa dinamis dan modern, menyamarkan waktu tunggu request jaringan.
