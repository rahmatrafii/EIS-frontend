# V-03 — Halaman Verifikasi OTP (OTP Verification Page)

## 1. Deskripsi Bisnis & Tujuan Fitur
Halaman Verifikasi OTP berfungsi sebagai validasi kepemilikan email aktif oleh pengunjung. Dengan memasukkan 6-digit kode unik yang dikirimkan ke kotak masuk email, sistem dapat menjamin keamanan autentikasi tanpa kata sandi (passwordless), kemudian mengeluarkan JSON Web Token (JWT) resmi untuk mengizinkan pengunjung memulai sesi kunjungan edukasi mereka.

## 2. Alur Pengguna (User Flow)
1. Pengunjung berhasil melakukan registrasi (`/register`) atau memasukkan email pada login (`/login`).
2. Browser dialihkan ke rute `/verify-otp`.
3. Pengunjung melihat teks instruksi: *"Kode verifikasi dikirim ke [alamat_email]"*.
4. Pengunjung memasukkan 6 digit angka ke dalam 6 kotak input terpisah (`OtpInput.tsx`).
   * Fokus kursor otomatis berpindah ke kotak kanan berikutnya saat angka diketik.
   * Tombol *backspace* mengembalikan fokus kursor ke kotak kiri sebelumnya jika kosong.
5. Pengunjung menekan tombol **"Verifikasi"** (atau ter-submit otomatis saat digit ke-6 terisi).
6. Jika kode OTP benar:
   * JWT disimpan ke `localStorage`.
   * Cookie sinyal auth (`eis_auth` & `eis_role`) disematkan ke browser.
   * Pengunjung diarahkan secara otomatis ke halaman kuis pra-kunjungan `/quiz/pre-zoo`.
7. Jika countdown timer (60 detik) habis, pengunjung dapat menekan tombol **"Kirim Ulang OTP"** jika kode belum sampai.

## 3. Spesifikasi Teknis & Rute (Route)
* **Route Path**: `/verify-otp`
* **Target Device**: Mobile Web (max-width `430px`)
* **Layout Shell**: `(auth)/layout.tsx` (centered container layout, no navbar)
* **Status Otorisasi**: Public (dapat diakses sebelum token didapatkan, namun membutuhkan alamat email valid di cache session).

## 4. Struktur Antarmuka (UI Structure) & Komponen Pendukung
* **Header**: Tombol kembali ke registrasi / login + judul "Verifikasi Email".
* **Instruksi Teks**: Label dinamis menampilkan email target.
* **OTP Input Row**: Grid 6 kolom input horizontal (`OtpInput.tsx`) yang berjarak seragam (`gap-2`).
* **Countdown & Resend Area**: Teks timer melingkar visual (`OtpCountdown.tsx`) yang berubah warna menjadi hijau terang setelah timer berakhir untuk menunjukkan tombol resend aktif.
* **Tombol Verifikasi**: CTA utama yang memiliki status loading (`isVerifying`).

### Komponen yang Digunakan:
* `MobileShell.tsx` (`src/components/layout/visitor/MobileShell.tsx`): Wrapper viewport.
* `OtpInput.tsx` (`src/components/auth/OtpInput.tsx`): Penanganan fokus berantai DOM input 6 digit dengan manipulasi `useRef`.
* `OtpCountdown.tsx` (`src/components/auth/OtpCountdown.tsx`): Timer visual berbasis interval waktu detik.
* `Button.tsx` (`src/components/ui/Button.tsx`): Reusable submit button.

---

## 5. State Management & Lifecycle
* **Type Rendering**: Client Component (`'use client'`).
* **State Lokal**:
  * `otp`: String penampung gabungan kode (`string` dengan panjang maksimal 6 karakter).
  * `countdown`: Integer waktu mundur (mulai dari 60 hingga 0).
  * `isVerifying`: Boolean status tunggu verifikasi API.
  * `isResending`: Boolean status tunggu kirim ulang API.
  * `error`: Teks pesan eror jika input salah atau kedaluwarsa.
* **Lifecycle**:
  * `useEffect` mendeteksi ketiadaan email target di `sessionStorage` pada saat *mount*. Jika kosong, pengunjung langsung dikembalikan ke `/register` untuk mencegah akses bypass ilegal.
  * `useEffect` menjalankan timer interval (`setInterval` 1 detik) untuk mengurangi nilai state `countdown` jika nilainya > 0.

---

## 6. Integrasi API & Payload Data
* **Endpoint Terkait**: 
  * Verifikasi: `POST /users/verify-otp`
  * Kirim Ulang: `POST /users/request-otp`
* **Service Function**: `verifyOtp(payload)` dan `requestOtp(email)` di `src/services/auth.service.ts`
* **Payload Request Verifikasi**:
  ```ts
  interface VerifyOtpPayload {
    email: string;
    otp: string; // 6-digit numeric string
  }
  ```
* **Response Data Sukses (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Verifikasi OTP berhasil.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "usr_abc123",
        "name": "Budi Santoso",
        "email": "budi@email.com",
        "age": 25,
        "role": "visitor"
      }
    }
  }
  ```

---

## 7. Aturan Bisnis (Business Rules) & Validasi
* **Validasi OTP Klien**: Kode OTP harus tepat 6 digit dan hanya berisi karakter angka murni (`/^\d{6}$/`).
* **Pembatasan Resend**: Tombol "Kirim Ulang OTP" dinonaktifkan (`disabled`) secara mutlak selama `countdown > 0` untuk menghindari spam request ke mail server.
* **Pemberian Sinyal Auth Cookie**:
  Untuk menyiasati Next.js Middleware di sisi server yang tidak dapat membaca `localStorage`, login sukses wajib menuliskan cookie sinyal:
  ```ts
  document.cookie = `eis_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
  document.cookie = `eis_role=visitor; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
  ```

---

## 8. Ketergantungan (Dependency) & Alur Data Antar Fitur
* **Sebelumnya**: Bergantung pada tersimpannya email di `sessionStorage` key `eis_registration_email` atau `eis_login_email`.
* **Selanjutnya**: Setelah sukses, token JWT disimpan di `localStorage` melalui helper `saveToken(token)`. Route selanjutnya dipaksa ke kuis pre-zoo `/quiz/pre-zoo`.

---

## 9. Penanganan Skenario Batas (Edge Cases)
* **Kode OTP Salah / Kedaluwarsa**: Kotak input digetarkan sesaat (animasi shake) dan dibersihkan dari isinya, lalu teks eror merah muncul di bawah baris input OTP.
* **Penyalinan Kode (Copypaste)**: Input didesain agar dapat menerima aksi *paste* teks 6 digit secara langsung, membagi teks ke tiap kotak input otomatis secara berurutan.

---

## 10. Catatan Pengembangan & Maintenance
* Kebocoran Memori (*Memory Leaks*): Interval timer wajib di-clear (`clearInterval`) dalam fungsi cleanup *useEffect* untuk mencegah konsumsi RAM latar belakang yang berlebihan jika halaman ditinggalkan sebelum countdown selesai.
