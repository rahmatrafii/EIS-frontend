# SOP-01 — Folder Structure

> **Aturan keras**: Jangan buat folder atau file di luar struktur yang sudah didefinisikan di sini tanpa mendiskusikannya terlebih dahulu.

---

## Struktur Lengkap

```
eis-frontend/
├── docs/                              # SOP dan dokumentasi proyek
│
├── public/
│   ├── icons/                         # SVG icon statis
│   └── images/                        # Logo, placeholder, badge assets
│
├── src/
│   ├── app/                           # Next.js App Router
│   │
│   │   # ─────────────────────────────────────────────
│   │   # VISITOR APP — Mobile Web (18 halaman)
│   │   # ─────────────────────────────────────────────
│   │
│   │   ├── welcome/                   # V-01: Halaman Selamat Datang
│   │   │   └── page.tsx
│   │   │
│   │   ├── (auth)/                    # Route group: auth pages (no layout)
│   │   │   ├── register/              # V-02: Registrasi
│   │   │   │   └── page.tsx
│   │   │   ├── verify-otp/            # V-03: Verifikasi OTP
│   │   │   │   └── page.tsx
│   │   │   ├── login/                 # V-04: Login pengunjung
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx             # Layout: centered, no navbar
│   │   │
│   │   ├── (visitor)/                 # Route group: halaman utama pengunjung
│   │   │   ├── home/                  # V-06: Home / Dashboard Pengunjung
│   │   │   │   └── page.tsx
│   │   │   ├── scan/                  # V-07: Scan QR Kandang
│   │   │   │   └── page.tsx
│   │   │   ├── exhibit/
│   │   │   │   └── [exhibit_id]/
│   │   │   │       ├── page.tsx       # V-08: Halaman Kandang
│   │   │   │       ├── audio/
│   │   │   │       │   └── page.tsx   # V-09: Audio Player
│   │   │   │       ├── video/
│   │   │   │       │   └── page.tsx   # V-10: Video Player
│   │   │   │       ├── infographic/
│   │   │   │       │   └── page.tsx   # V-11: Infografis
│   │   │   │       └── lab/
│   │   │   │           └── page.tsx   # V-12: Interactive Lab
│   │   │   ├── quiz/
│   │   │   │   ├── pre-zoo/           # V-05: Pre-Test
│   │   │   │   │   └── page.tsx
│   │   │   │   └── post-zoo/          # V-13: Post-Test
│   │   │   │       └── page.tsx
│   │   │   ├── visit-result/          # V-14: Hasil Kunjungan
│   │   │   │   └── page.tsx
│   │   │   ├── score/                 # V-15: EIS Score
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx           # V-16: Profil
│   │   │   │   └── retention-status/
│   │   │   │       └── page.tsx       # V-18: Status Retensi
│   │   │   └── layout.tsx             # Layout: mobile shell + bottom nav
│   │   │
│   │   ├── retention/                 # V-17: Retention Quiz (PUBLIC, no auth)
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   │
│   │   # ─────────────────────────────────────────────
│   │   # ADMIN APP — Desktop Browser (10 halaman)
│   │   # ─────────────────────────────────────────────
│   │   │
│   │   ├── (admin-auth)/              # Route group: admin auth (no sidebar)
│   │   │   ├── admin/
│   │   │   │   └── login/             # A-01: Login Admin
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/                   # Route group: admin pages (sidebar layout)
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/         # A-02: Dashboard Utama
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── exhibits/      # A-03: Analytics Kandang
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── visitors/
│   │   │   │   │       ├── page.tsx   # A-04: Analytics Pengunjung
│   │   │   │   │       └── [user_id]/
│   │   │   │   │           └── page.tsx # A-05: Detail Pengunjung
│   │   │   │   ├── exhibits/
│   │   │   │   │   ├── page.tsx       # A-06: Daftar Kandang
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx   # A-08: Tambah Kandang
│   │   │   │   │   └── [exhibit_id]/
│   │   │   │   │       └── page.tsx   # A-07: Detail Kandang
│   │   │   │   └── quizzes/
│   │   │   │       ├── page.tsx       # A-09: Manajemen Kuis
│   │   │   │       └── [quiz_id]/
│   │   │   │           └── page.tsx   # A-10: Tambah/Edit Kuis
│   │   │   └── layout.tsx             # Layout: sidebar + topbar
│   │   │
│   │   # ─────────────────────────────────────────────
│   │   # ROOT FILES
│   │   # ─────────────────────────────────────────────
│   │   ├── globals.css
│   │   ├── layout.tsx                 # Root layout (providers only)
│   │   ├── page.tsx                   # Redirect: / → /welcome atau /home
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── ui/                        # Primitif — tidak ada logika bisnis
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── ToastContainer.tsx
│   │   │
│   │   ├── layout/                    # Komponen layout global
│   │   │   ├── visitor/
│   │   │   │   ├── MobileShell.tsx    # Wrapper max-width + safe area
│   │   │   │   ├── BottomNav.tsx      # Navigasi bawah mobile
│   │   │   │   └── PageHeader.tsx     # Header dengan back button
│   │   │   └── admin/
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Topbar.tsx
│   │   │       └── AdminShell.tsx
│   │   │
│   │   ├── auth/                      # Komponen spesifik fitur auth
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── OtpInput.tsx
│   │   │   ├── OtpCountdown.tsx
│   │   │   └── LoginForm.tsx
│   │   │
│   │   ├── visitor/                   # Komponen spesifik fitur pengunjung
│   │   │   ├── WelcomeHero.tsx
│   │   │   ├── QrScanner.tsx
│   │   │   ├── ExhibitHero.tsx
│   │   │   ├── MediaGrid.tsx          # 4 tombol media di halaman kandang
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── InfographicViewer.tsx
│   │   │   ├── InteractiveLab.tsx
│   │   │   ├── QuizCard.tsx           # Wrapper satu soal kuis
│   │   │   ├── QuizProgress.tsx       # Progress bar kuis
│   │   │   ├── QuizOption.tsx         # Tombol pilihan jawaban
│   │   │   ├── VisitSummaryCard.tsx
│   │   │   ├── EisScoreDisplay.tsx
│   │   │   ├── EisGradeBadge.tsx
│   │   │   ├── RetentionStatusCard.tsx
│   │   │   └── SessionTimer.tsx
│   │   │
│   │   └── admin/                     # Komponen spesifik fitur admin
│   │       ├── StatsCard.tsx
│   │       ├── TrendChart.tsx
│   │       ├── ExhibitTable.tsx
│   │       ├── ExhibitForm.tsx
│   │       ├── ContentEditor.tsx
│   │       ├── MediaUploader.tsx
│   │       ├── QrCodeDisplay.tsx
│   │       ├── QuizTable.tsx
│   │       ├── QuizForm.tsx
│   │       ├── QuestionBuilder.tsx    # Builder soal dinamis
│   │       ├── VisitorTable.tsx
│   │       └── EisBreakdownChart.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSession.ts
│   │   ├── useCheckin.ts
│   │   ├── useQuiz.ts
│   │   ├── useEisScore.ts
│   │   ├── useRetention.ts
│   │   ├── useProfile.ts
│   │   ├── useToast.ts
│   │   ├── useQrScanner.ts            # Akses kamera + decode QR
│   │   ├── useMediaPlayer.ts          # State audio/video player
│   │   └── admin/
│   │       ├── useAdminExhibits.ts
│   │       ├── useAdminQuizzes.ts
│   │       └── useAdminAnalytics.ts
│   │
│   ├── services/
│   │   ├── api.ts                     # Base fetch wrapper
│   │   ├── auth.service.ts
│   │   ├── session.service.ts
│   │   ├── quiz.service.ts
│   │   ├── track.service.ts
│   │   ├── retention.service.ts
│   │   ├── analytics.service.ts
│   │   └── admin.service.ts
│   │
│   ├── stores/
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   │
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── user.types.ts
│   │   ├── exhibit.types.ts
│   │   ├── session.types.ts
│   │   ├── quiz.types.ts
│   │   ├── tracking.types.ts
│   │   ├── analytics.types.ts
│   │   └── admin.types.ts
│   │
│   ├── constants/
│   │   ├── env.ts
│   │   ├── routes.ts
│   │   ├── api-endpoints.ts
│   │   └── app.ts
│   │
│   ├── lib/
│   │   ├── cn.ts
│   │   ├── format.ts
│   │   ├── token.ts
│   │   ├── age.ts                     # Hitung kategori umur dari tanggal lahir
│   │   └── validators.ts
│   │
│   └── middleware.ts
│
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Aturan Penempatan File

### ✅ BENAR
- Komponen dipakai >1 fitur → `src/components/ui/`
- Komponen hanya di visitor → `src/components/visitor/`
- Komponen hanya di admin → `src/components/admin/`
- Hook admin-only → `src/hooks/admin/`
- Logika fetch → `src/services/`
- State + efek → `src/hooks/`
- Tipe TypeScript → `src/types/`
- Konstanta string/URL → `src/constants/`

### ❌ SALAH
- Fetch langsung di `page.tsx` client component
- Buat folder baru di `src/` yang tidak ada di SOP ini
- Taruh types di dalam file komponen (kecuali tipe prop lokal sederhana)
- Taruh konstanta string literal di dalam JSX

---

## Konvensi Penamaan File

| Jenis | Konvensi | Contoh |
|-------|----------|--------|
| Komponen React | PascalCase | `QuizCard.tsx` |
| Custom hook | camelCase, prefix `use` | `useQuiz.ts` |
| Service | camelCase, suffix `.service` | `quiz.service.ts` |
| Type file | camelCase, suffix `.types` | `quiz.types.ts` |
| Utility/lib | camelCase | `format.ts`, `age.ts` |
| Konstanta | kebab-case | `api-endpoints.ts` |
| Page (App Router) | lowercase | `page.tsx`, `layout.tsx` |