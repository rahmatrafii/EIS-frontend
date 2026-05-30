# SOP-12 — Testing & QA Checklist

> Checklist ini wajib dilalui sebelum menganggap sebuah fitur **selesai** dan siap di-push.

---

## 1. Checklist Umum (Semua Fitur)

### TypeScript
- [ ] `npx tsc --noEmit` tidak menghasilkan error
- [ ] Tidak ada `any`, `as unknown`, atau `@ts-ignore`
- [ ] Semua prop komponen bertipe dengan benar

### Kode
- [ ] `npm run lint` tidak menghasilkan error atau warning
- [ ] Tidak ada `console.log` yang tertinggal di kode produksi
- [ ] Tidak ada kode yang di-comment out (hapus saja)
- [ ] Semua import digunakan (tidak ada unused import)

### Komponen
- [ ] Loading state: terlihat saat data sedang di-fetch
- [ ] Error state: terlihat + ada tombol retry jika fetch bisa diulang
- [ ] Empty state: terlihat jika data array kosong
- [ ] Success state: data tampil dengan benar

### Responsif
- [ ] Terlihat baik di mobile (375px)
- [ ] Terlihat baik di tablet (768px)
- [ ] Terlihat baik di desktop (1280px)

---

## 2. Checklist Auth Flow

- [ ] **Register**: Form tersubmit → sukses → redirect ke login
- [ ] **Register error**: Email sudah terdaftar → error tampil di field email
- [ ] **Request OTP**: Email dikirim → tampil input OTP + countdown 60 detik
- [ ] **OTP Verify sukses**: Token tersimpan → redirect ke dashboard
- [ ] **OTP Verify salah**: Error tampil, bisa request ulang setelah countdown
- [ ] **Logout**: Token terhapus → redirect ke login → tidak bisa back ke halaman sebelumnya
- [ ] **Akses halaman protected tanpa login**: Redirect ke login
- [ ] **Visitor akses halaman admin**: Redirect ke dashboard visitor
- [ ] **Token expired (401)**: Redirect ke login dengan pesan sesi berakhir

---

## 3. Checklist Visitor Flow

### Dashboard
- [ ] EIS score terbaru tampil (jika ada)
- [ ] Status retensi kuis tampil
- [ ] Riwayat sesi tampil

### Session
- [ ] Tombol mulai sesi → POST /sessions/start → sesi aktif
- [ ] Timer sesi berjalan
- [ ] Sesi aktif tersimpan di sessionStorage
- [ ] Tidak bisa mulai sesi baru jika masih ada sesi aktif
- [ ] Tombol akhiri sesi → POST /sessions/end → redirect ke quiz POST_ZOO

### Check-in Exhibit
- [ ] Input QR code → POST /track/checkin → exhibit info tampil
- [ ] Interaksi media tercatat → PATCH /track/interact
- [ ] Lab activity tersimpan → POST /track/lab-log
- [ ] Checkout exhibit → POST /track/checkout → durasi tercatat

### Kuis
- [ ] Kuis PRE_ZOO: muncul setelah mulai sesi, sebelum check-in pertama
- [ ] Kuis POST_ZOO: muncul setelah akhiri sesi
- [ ] Progress kuis tampil (soal X dari Y)
- [ ] Tidak bisa submit tanpa menjawab semua soal
- [ ] Hasil kuis tampil setelah submit

### EIS Score
- [ ] Score tampil setelah POST_ZOO selesai
- [ ] Semua komponen score tampil: knowledge, engagement, retention
- [ ] Progress bar animasi muncul dengan benar

---

## 4. Checklist Retention Flow

- [ ] Email kuis retensi: link bisa dibuka → kuis tampil
- [ ] Token tidak valid: halaman error yang informatif
- [ ] Token sudah dipakai: pesan "Anda sudah mengerjakan kuis ini"
- [ ] Submit kuis retensi → EIS score di-recalculate
- [ ] Halaman tidak butuh login (public)

---

## 5. Checklist Admin Flow

### Exhibits
- [ ] List exhibit tampil dengan benar
- [ ] Form tambah exhibit: validasi + submit + sukses → list refresh
- [ ] Hapus exhibit: konfirmasi dulu → sukses → hilang dari list

### Content & Media
- [ ] Form tambah konten: upload berhasil via Cloudinary
- [ ] Form tambah media: file picker, preview sebelum upload
- [ ] Validasi tipe file (video/audio/gambar)

### Quiz Builder
- [ ] Bisa tambah pertanyaan dinamis
- [ ] Bisa set jawaban benar
- [ ] Submit quiz: semua pertanyaan wajib terisi
- [ ] Preview soal sebelum simpan

### Analytics Dashboard
- [ ] Angka statistik tampil (total visitor, sesi aktif, rata-rata EIS)
- [ ] Top exhibit tampil
- [ ] Distribusi score tampil (chart/diagram)

---

## 6. Checklist Performa & UX

- [ ] Tidak ada layout shift saat data loading
- [ ] Skeleton/spinner tampil saat loading (bukan layar kosong)
- [ ] Tombol submit disabled saat proses berlangsung (tidak bisa double-submit)
- [ ] Animasi halus (tidak patah-patah)
- [ ] Pesan sukses (toast) muncul setelah aksi berhasil
- [ ] Pesan error (toast atau field) muncul setelah aksi gagal

---

## 7. Cara Run Build Check

```bash
# Wajib dilakukan sebelum push fitur baru
npm run build

# Jika ada error TypeScript atau linting
npx tsc --noEmit
npm run lint

# Cek semua tipe
npx tsc --noEmit --strict
```

Jangan push jika `npm run build` menghasilkan error.
