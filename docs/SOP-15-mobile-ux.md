# SOP-15 — Mobile UX & Layout (Visitor App)

> **Berlaku untuk**: Semua 18 halaman Visitor App. Baca SOP ini sebelum mengerjakan halaman apapun di Visitor App.

---

## 1. Prinsip Dasar Mobile-First

```
1. Semua layout didesain untuk lebar 375px terlebih dahulu
2. Max-width konten: 430px — lebih dari itu tetap centered
3. Tidak ada horizontal scroll
4. Setiap elemen interaktif min-height 44px (standar Apple HIG)
5. Touch target min-width 44px (tidak ada tombol kecil berdampingan)
6. Tidak ada hover-only interaction — semua aksi harus bisa dilakukan dengan tap
7. Font minimum: 14px untuk body, 12px untuk caption
```

---

## 2. Shell & Wrapper Utama

Setiap halaman visitor **wajib** dibungkus dengan `MobileShell.tsx`:

```tsx
// src/components/layout/visitor/MobileShell.tsx
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

interface MobileShellProps {
  children: ReactNode
  className?: string
  noPadding?: boolean  // untuk halaman fullscreen (kamera, video)
}

export function MobileShell({ children, className, noPadding }: MobileShellProps) {
  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div
        className={cn(
          'relative flex w-full max-w-[430px] flex-col bg-gray-50',
          'min-h-screen overflow-x-hidden',
          !noPadding && 'pb-20',  // ruang untuk bottom nav
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
```

**Aturan penggunaan:**
- `noPadding={true}` hanya untuk: halaman Scan QR (V-07), halaman Video Player (V-10), halaman Infografis fullscreen (V-11)
- `pb-20` adalah ruang untuk bottom navigation bar (80px)
- Jangan tambahkan padding lain di luar `MobileShell`

---

## 3. Safe Area — Notch & Home Indicator

Untuk HP modern dengan notch atau home indicator, gunakan CSS environment variables:

```tsx
// Tambahkan di globals.css
@supports (padding-top: env(safe-area-inset-top)) {
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

```tsx
// Header yang menyentuh tepi atas layar
<header className="safe-area-top bg-emerald-700 px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))]">

// Bottom nav
<nav className="safe-area-bottom fixed bottom-0 left-0 right-0">
```

**Kapan pakai safe area:**
- Header full-bleed yang mentok ke atas layar: wajib `safe-area-top`
- Bottom navigation: wajib `safe-area-bottom`
- Halaman fullscreen (kamera): wajib keduanya

---

## 4. Header Pattern

Ada 3 jenis header yang digunakan di Visitor App:

### Header Type 1 — Hero Header (halaman utama section)
Digunakan di: Welcome (V-01), Home (V-06), Hasil Kunjungan (V-14), EIS Score (V-15)

```tsx
// Background penuh, konten di atasnya
<header className={cn(
  'safe-area-top',
  'bg-emerald-700 px-4 pb-8 pt-4',
  'rounded-b-3xl'  // sudut bawah melengkung
)}>
  <div className="flex items-center justify-between">
    <span className="text-sm font-bold text-white">ZOO</span>
    {/* aksi kanan opsional */}
  </div>
  {/* konten hero */}
</header>
```

### Header Type 2 — Navigation Header (halaman dalam)
Digunakan di: Kandang (V-08), Audio (V-09), Video (V-10), Profil (V-16), Status Retensi (V-18)

```tsx
// src/components/layout/visitor/PageHeader.tsx
interface PageHeaderProps {
  title: string
  onBack?: () => void
  rightElement?: ReactNode
  transparent?: boolean
}

export function PageHeader({ title, onBack, rightElement, transparent }: PageHeaderProps) {
  return (
    <header className={cn(
      'safe-area-top sticky top-0 z-30',
      'flex items-center gap-3 px-4 pb-3 pt-4',
      transparent ? 'bg-transparent' : 'bg-white border-b border-gray-100'
    )}>
      {onBack && (
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
          aria-label="Kembali"
        >
          ←
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold text-gray-900">{title}</h1>
      {rightElement}
    </header>
  )
}
```

### Header Type 3 — Transparent Overlay (halaman media)
Digunakan di: Scan QR (V-07), Infografis fullscreen (V-11)

```tsx
// Absolut positioned di atas konten fullscreen
<header className="absolute inset-x-0 top-0 z-10 safe-area-top">
  <div className="bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-4">
    {/* tombol close + judul */}
  </div>
</header>
```

---

## 5. Bottom Navigation Bar

Muncul di halaman utama visitor: Home (V-06), Profil (V-16).
**Tidak muncul di**: halaman kuis, kandang, scan QR, media player, dan halaman auth.

```tsx
// src/components/layout/visitor/BottomNav.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, User, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/constants/routes'

const NAV_ITEMS = [
  { label: 'Beranda', icon: Home, href: ROUTES.dashboard },
  { label: 'Progres', icon: BarChart2, href: ROUTES.score },
  { label: 'Profil', icon: User, href: ROUTES.profile },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className={cn(
      'safe-area-bottom',
      'fixed bottom-0 inset-x-0 z-40 flex justify-center',
    )}>
      <div className={cn(
        'flex w-full max-w-[430px] items-center',
        'border-t border-gray-100 bg-white px-4 pt-2',
      )}>
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2',
                'transition-colors duration-150',
                isActive ? 'text-emerald-600' : 'text-gray-400'
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-emerald-600' : 'text-gray-400'
              )}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-500" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

**Aturan bottom nav:**
- Selalu `fixed bottom-0` — tidak ikut scroll
- Height total termasuk safe area: minimal 60px + safe area inset
- Active item: ikon lebih tebal + warna emerald + garis atas tipis
- `pb-20` di `MobileShell` mengimbangi ketinggian bottom nav

---

## 6. Scroll Behavior

```tsx
// Halaman yang bisa scroll: gunakan ini di root elemen
<main className="flex-1 overflow-y-auto overflow-x-hidden">

// Section dengan scroll horizontal (chip, tag)
<div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">

// Scroll ke atas saat navigate — di page.tsx
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
}, [])
```

**Aturan scroll:**
- Tidak ada `overflow: hidden` di root yang memblokir scroll
- Scroll hanya vertikal — tidak ada horizontal scroll di halaman
- Exception: chip/tag row boleh horizontal scroll (dengan `scrollbar-hide`)
- Jangan gunakan `height: 100vh` yang tidak memperhitungkan browser chrome HP

---

## 7. Touch Targets & Spacing

```
Minimum touch target: 44×44px (wajib untuk semua elemen interaktif)
Jarak antar touch target yang berdampingan: minimal 8px

Padding konten halaman:
- Horizontal: px-4 (16px kiri kanan)
- Vertikal antar section: gap-4 atau gap-6
- Card padding: p-4 atau p-5

Tombol full-width: w-full, height min h-12 (48px), rounded-2xl
Tombol inline/kecil: min h-9 (36px), min w-9
```

```tsx
// BENAR — touch target cukup besar
<button className="flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 text-white">
  Mulai
</button>

// BENAR — tombol ikon
<button className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
  <X size={18} />
</button>

// SALAH — terlalu kecil
<button className="px-2 py-1 text-xs">Klik</button>
```

---

## 8. Typography Scale (Mobile)

```tsx
// Display — skor besar, angka hero
<p className="text-5xl font-bold tabular-nums text-gray-900">85</p>

// Page title
<h1 className="text-2xl font-bold tracking-tight text-gray-900">

// Section title
<h2 className="text-lg font-semibold text-gray-900">

// Card title
<h3 className="text-base font-medium text-gray-900">

// Body text
<p className="text-sm leading-relaxed text-gray-600">

// Caption / label
<span className="text-xs text-gray-400">

// Chip / badge text
<span className="text-xs font-medium">
```

**Aturan tipografi mobile:**
- Tidak ada teks di bawah 12px (`text-xs`)
- `leading-relaxed` untuk semua body text (penting untuk keterbacaan)
- `tabular-nums` untuk angka yang berubah (timer, skor) agar tidak bergeser
- Warna teks: `gray-900` untuk judul, `gray-600` untuk body, `gray-400` untuk caption

---

## 9. Card Pattern

Ada 2 jenis card di Visitor App:

### Card Biasa
```tsx
<div className="rounded-2xl bg-white p-4 shadow-sm">
  {/* konten */}
</div>
```

### Card Interaktif (bisa diklik/tap)
```tsx
<button
  className={cn(
    'w-full rounded-2xl bg-white p-4 shadow-sm text-left',
    'transition-transform duration-150 active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
  )}
>
  {/* konten */}
</button>
```

**Aturan card:**
- Border radius: `rounded-2xl` (16px) untuk card besar, `rounded-xl` untuk card kecil
- Shadow: `shadow-sm` — jangan `shadow-lg` untuk card biasa
- Active state: `active:scale-[0.98]` untuk feedback tap
- Tidak ada hover state yang mengubah layout (ghost pada desktop saja)

---

## 10. Form & Input Mobile

```tsx
// Input mobile-friendly
<input
  className={cn(
    'h-12 w-full rounded-xl border border-gray-200 bg-white px-4',
    'text-base text-gray-900',  // text-base (16px) untuk prevent iOS zoom
    'placeholder:text-gray-400',
    'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
    'transition-colors duration-150'
  )}
/>
```

**Aturan input mobile:**
- Gunakan `text-base` (16px) untuk input — di bawah 16px iOS auto-zoom saat fokus
- `height: 48px` minimum untuk semua input
- `inputMode` yang tepat:
  - Email: `inputMode="email"`
  - Angka: `inputMode="numeric"`
  - Telepon: `inputMode="tel"`
- Tombol submit selalu di bawah form, `w-full`
- Jarak antar field: `gap-4` atau `space-y-4`

---

## 11. Loading States

### Skeleton Loading (untuk list/card)
```tsx
// Skeleton card
<div className="animate-pulse rounded-2xl bg-white p-4 shadow-sm">
  <div className="h-4 w-3/4 rounded-full bg-gray-200" />
  <div className="mt-2 h-3 w-1/2 rounded-full bg-gray-200" />
</div>

// Skeleton text line
<div className="h-3 w-full animate-pulse rounded-full bg-gray-200" />
```

### Full Page Loading (untuk halaman yang fetch berat)
```tsx
// Spinner centered di halaman
<div className="flex min-h-[60vh] items-center justify-center">
  <Spinner className="h-8 w-8 text-emerald-500" />
</div>
```

### Inline Loading (tombol)
```tsx
// Sudah di-handle Button component via isLoading prop
<Button isLoading={isSubmitting}>Simpan</Button>
```

**Aturan loading:**
- Gunakan skeleton untuk list dan card (lebih baik dari spinner kosong)
- Gunakan spinner hanya untuk full-page loading atau aksi sekunder
- Selalu tunjukkan loading — jangan layar kosong tanpa feedback

---

## 12. Gesture & Interaksi

### Swipe Back (navigasi)
- Next.js App Router secara default mendukung browser swipe back
- Jangan block gesture swipe dengan `overflow: hidden` di root

### Pull to Refresh
- Tidak diimplementasikan di versi awal — gunakan tombol refresh manual jika diperlukan

### Long Press
- Tidak digunakan di Visitor App — hindari gesture yang tidak intuitif

### Pinch Zoom
- Hanya di halaman Infografis (V-11): implementasi manual via touch events
- Semua halaman lain: `touch-action: pan-y` (hanya scroll vertikal)

```css
/* globals.css — prevent accidental pinch zoom di halaman lain */
body {
  touch-action: pan-y;
}

/* Exception untuk halaman infografis */
.pinch-zoom-container {
  touch-action: none;
}
```

---

## 13. Animasi Mobile

Prinsip animasi di mobile berbeda dari desktop:

```
- Durasi lebih pendek: 200-300ms (desktop bisa 300-500ms)
- Hindari animasi berat saat scroll
- Gunakan transform (translate, scale) bukan animasi yang trigger layout
- Hindari animasi simultan lebih dari 2 elemen
- Selalu sediakan reduced-motion alternative
```

```tsx
// Reduced motion support
import { motion, useReducedMotion } from 'framer-motion'

export function AnimatedCard({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
    >
      {children}
    </motion.div>
  )
}
```

---

## 14. Warna & Kontras Mobile

Layar HP sering digunakan di luar ruangan — kontras harus lebih tinggi:

```
Text utama pada background putih: gray-900 (kontras 21:1) ✅
Text sekunder pada background putih: gray-600 (kontras 7:1) ✅
Text caption pada background putih: gray-400 (kontras 3:1) — minimum ✅
Text putih pada emerald-600: (kontras 4.5:1) ✅

HINDARI:
- gray-300 pada putih (kontras 1.88:1) ❌
- emerald-300 pada putih (terlalu terang) ❌
- Text kuning pada putih ❌
```

---

## 15. Halaman Khusus — Fullscreen

Beberapa halaman membutuhkan treatment khusus (fullscreen, tidak ada bottom nav):

### Scan QR (V-07)
```tsx
// Layout fullscreen kamera
export default function ScanPage() {
  return (
    <MobileShell noPadding>
      {/* Header overlay transparan */}
      {/* Viewport kamera penuh */}
      {/* Overlay frame QR */}
      {/* Bottom panel tipis dengan tombol manual */}
    </MobileShell>
  )
}
```

### Video Player (V-10)
```tsx
// Video landscape di halaman portrait
<div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
  <video
    className="absolute inset-0 h-full w-full bg-black object-contain"
    // ...
  />
</div>
```

### Infografis (V-11)
```tsx
// Gambar bisa di-pinch zoom
<div className="pinch-zoom-container relative h-screen w-full overflow-hidden bg-black">
  <img
    className="absolute inset-0 h-full w-full object-contain"
    style={{
      transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
      transformOrigin: 'center center',
      transition: isPinching ? 'none' : 'transform 0.1s ease-out',
    }}
  />
</div>
```

---

## 16. Checklist Sebelum Push Halaman Visitor

Selain checklist di SOP-12, halaman visitor wajib melewati ini:

**Layout:**
- [ ] Dibungkus `MobileShell`
- [ ] Tidak ada elemen yang keluar dari max-width 430px
- [ ] Tidak ada horizontal scroll yang tidak disengaja
- [ ] `pb-20` ada di MobileShell untuk ruang bottom nav (kecuali halaman fullscreen)

**Touch & Interaksi:**
- [ ] Semua tombol dan link min 44×44px
- [ ] Input menggunakan `text-base` (bukan `text-sm`)
- [ ] Input punya `inputMode` yang tepat
- [ ] Active state (tap feedback) ada di semua tombol

**Header & Navigasi:**
- [ ] Halaman punya header yang jelas
- [ ] Tombol back ada di semua halaman dalam
- [ ] Safe area top diterapkan di header
- [ ] Bottom nav muncul di halaman yang seharusnya

**Performa:**
- [ ] Tidak ada gambar tanpa dimensi (mencegah layout shift)
- [ ] Loading state ada
- [ ] Error state ada
- [ ] Dicoba di viewport 375px (iPhone SE) — pastikan tidak ada yang terpotong

**Aksesibilitas:**
- [ ] Semua tombol punya `aria-label` jika tidak ada teks
- [ ] Semua input punya `label` yang terhubung
- [ ] Warna memenuhi kontras minimum 4.5:1
- [ ] Halaman bisa dinagivasi dengan screen reader (urutan elemen logis)
