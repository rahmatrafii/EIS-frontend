# V-02 — Halaman Registrasi (Registration Page)

## 1. Deskripsi Bisnis & Tujuan Fitur
Halaman Registrasi memfasilitasi pendaftaran bagi pengunjung baru kebun binatang. Dengan mendaftarkan nama lengkap, email aktif, dan tanggal lahir, sistem dapat membuat profil pengunjung baru, menentukan kategori usia mereka (anak, remaja, dewasa) untuk konten edukasi yang personal, serta memicu pengiriman kode verifikasi OTP (One-Time Password) ke email mereka demi keamanan data.

## 2. Alur Pengguna (User Flow)
1. Pengunjung menekan tombol **"Mulai Petualangan"** pada landing page `/welcome`.
2. Pengunjung diarahkan ke halaman registrasi (`/register`).
3. Pengunjung mengisi form terproteksi:
   * **Nama Lengkap**
   * **Email**
   * **Tanggal Lahir** (menggunakan native date picker bawaan browser).
4. Pengunjung menekan tombol **"Daftar"**.
5. Jika data valid:
   * Backend mendaftarkan user baru dan secara otomatis mengirimkan 6-digit OTP ke email pengunjung.
   * Aplikasi menyimpan alamat email yang diinput ke `sessionStorage` dengan key `eis_registration_email` (atau menggunakan token/state lokal untuk mem-pass data ke halaman OTP).
   * Aplikasi mengalihkan pengguna ke halaman verifikasi OTP (`/verify-otp`).
6. Jika data tidak valid:
   * Pesan eror visual muncul secara instan di bawah field masing-masing yang salah.

## 3. Spesifikasi Teknis & Rute (Route)
* **Route Path**: `/register`
* **Target Device**: Mobile Web (max-width `430px`)
* **Layout Shell**: `(auth)/layout.tsx` (centered container layout, no navbar)
* **Status Otorisasi**: Public

## 4. Struktur Antarmuka (UI Structure) & Komponen Pendukung
Antarmuka didesain minimalis dan terfokus pada form input.
* **Header Halaman**: Tombol kembali ke `/welcome` berupa ikon tipis serta judul halaman "Registrasi Pengunjung".
* **Form Container**: Menggunakan tumpukan elemen vertikal rapat (`space-y-4`).
  * Field Nama Lengkap (`Input.tsx`)
  * Field Email (`Input.tsx`) + Teks helper abu-abu kecil: *"OTP akan dikirim ke email ini"*
  * Field Tanggal Lahir (`Input.tsx`) dengan `type="date"` native.
  * Tombol Submit (`Button.tsx`) beranimasi loading.

### Komponen yang Digunakan:
* `MobileShell.tsx` (`src/components/layout/visitor/MobileShell.tsx`): Wrapper viewport.
* `PageHeader.tsx` (`src/components/layout/visitor/PageHeader.tsx`): Ikon back + judul halaman.
* `RegisterForm.tsx` (`src/components/auth/RegisterForm.tsx`): Komponen penampung form state, validasi, dan event handler.
* `Input.tsx` (`src/components/ui/Input.tsx`): Reusable input field dengan penampil eror bawaan.
* `Button.tsx` (`src/components/ui/Button.tsx`): Reusable button dengan spinner status *isSubmitting*.

---

## 5. State Management & Lifecycle
* **Type Rendering**: Client Component (`'use client'`).
* **State Lokal**:
  * `form`: Objek berisi nilai ter-control `{ name, email, birthDate }`.
  * `errors`: Objek penampung pesan eror validasi `{ name?, email?, birthDate? }`.
  * `isSubmitting`: Boolean penunjuk proses integrasi API (untuk mendisaktifkan tombol submit selama payload dikirim).

---

## 6. Integrasi API & Payload Data
* **Endpoint Terkait**: `POST /users/register`
* **Service Function**: `registerUser(payload)` di `src/services/auth.service.ts`
* **Payload Request**:
  ```ts
  interface RegisterPayload {
    name: string;
    email: string;
    birth_date: string; // Format YYYY-MM-DD
  }
  ```
* **Response Data Sukses (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registrasi berhasil. Kode OTP dikirim ke email Anda.",
    "data": {
      "userId": "usr_abc123"
    }
  }
  ```

---

## 7. Aturan Bisnis (Business Rules) & Validasi
Validasi dideklarasikan secara manual di `src/lib/validators.ts`:
* **Nama Lengkap**: Wajib diisi, minimal 2 karakter (mencegah inisial pendek).
* **Email**: Wajib diisi, harus memenuhi format regex email standar (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
* **Tanggal Lahir**:
  * Wajib diisi.
  * Tidak boleh merupakan tanggal di masa depan (tidak logis).
  * Batas usia maksimal adalah 100 tahun yang lalu (mencegah spam data).
  * Menggunakan `<input type="date">` native browser ponsel agar UX konsisten tanpa memuat library berat eksternal.

---

## 8. Ketergantungan (Dependency) & Alur Data Antar Fitur
* **Ke Depan**: Data `email` wajib disimpan di `sessionStorage` agar halaman `/verify-otp` dapat memproses verifikasi dan menampilkan teks *"OTP telah dikirim ke [email_anda]"*.
* **Ke Belakang**: Memiliki dependensi navigasi kembali ke `/welcome`.

---

## 9. Penanganan Skenario Batas (Edge Cases)
* **Email Sudah Terdaftar**: Jika backend mengembalikan status 400 dengan error detail bahwa email telah digunakan, error server dipetakan langsung ke state `errors.email` (sehingga label eror merah muncul di bawah input email secara kontekstual, bukan sebagai toast melayang).
* **Putus Koneksi di Tengah Transaksi**: State `isSubmitting` di-reset kembali ke `false` dalam blok `finally` atau penangkapan eror agar tombol dapat diklik ulang setelah koneksi stabil.

---

## 10. Catatan Pengembangan & Maintenance
* Mengikuti standard **SOP-08 (Form Handling)**:
  * Formulir menggunakan properti `noValidate` untuk mendisaktifkan validasi HTML5 standar agar gaya eror seragam dikontrol lewat CSS Tailwind.
  * Trigger pembersihan eror langsung dijalankan saat pengunjung mulai mengetik ulang di field yang salah (`onChange`).
