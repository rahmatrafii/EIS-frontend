# SOP-06 — Styling System

> **Stack**: Tailwind CSS v4 + `tailwind-merge` + `clsx`. Tidak ada CSS Module, tidak ada styled-components, tidak ada inline style.

---

## 1. Utility: `cn()`

Semua conditional class menggunakan `cn()` dari `src/lib/cn.ts`.

```ts
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

**Cara pakai:**
```tsx
// String biasa
<div className={cn('flex items-center gap-2')}>

// Conditional
<div className={cn('rounded-xl p-4', isActive && 'bg-emerald-50 ring-2 ring-emerald-500')}>

// Objek
<div className={cn({ 'opacity-50 pointer-events-none': isDisabled })}>

// Merge prop className
<div className={cn('base-class', className)}>
```

---

## 2. Design Tokens (Wajib Konsisten)

Semua nilai desain menggunakan skala Tailwind yang telah disepakati. **Jangan gunakan nilai arbitrary `[]` kecuali sangat terpaksa.**

### Warna Utama

| Peran | Class | Keterangan |
|-------|-------|-----------|
| Primary | `emerald-600` | Aksi utama, CTA |
| Primary hover | `emerald-700` | |
| Primary light | `emerald-50` | Background highlight |
| Secondary | `stone-600` | Aksi sekunder |
| Danger | `red-600` | Hapus, error |
| Warning | `amber-500` | Peringatan |
| Info | `sky-600` | Informasi |
| Text primary | `gray-900` | Judul, body text utama |
| Text secondary | `gray-500` | Label, helper text |
| Border | `gray-200` | Border card, input |
| Background | `gray-50` | Background halaman |
| Surface | `white` | Background card |

### Jangan Gunakan

- Warna arbitrary: `text-[#3b82f6]` ❌
- Warna zinc/neutral/slate/slate — pilih satu, gunakan `gray` ✅
- Gradien ungu (`purple`, `violet`) ❌ — tidak sesuai tema kebun binatang

---

## 3. Spacing & Sizing

Skala spacing yang disetujui:

| Kegunaan | Class |
|----------|-------|
| Gap antar elemen kecil | `gap-2` (8px) |
| Gap antar elemen sedang | `gap-4` (16px) |
| Gap antar section | `gap-6` atau `gap-8` |
| Padding card | `p-4` atau `p-6` |
| Padding halaman | `px-4 py-6` (mobile), `px-6 py-8` (desktop) |
| Max width konten | `max-w-screen-lg mx-auto` |

---

## 4. Tipografi

```
Font: Tidak menggunakan Inter atau Arial. Gunakan kombinasi:
- Display/Judul: font-serif (atau Google Font yang ditetapkan di globals.css)
- Body: font-sans (sistem default Tailwind)
```

```tsx
// Hirarki teks yang konsisten
<h1 className="text-2xl font-bold tracking-tight text-gray-900">   // Page title
<h2 className="text-lg font-semibold text-gray-900">               // Section title
<h3 className="text-base font-medium text-gray-900">               // Subsection
<p className="text-sm text-gray-600 leading-relaxed">              // Body text
<span className="text-xs text-gray-400">                           // Caption, label
```

---

## 5. Komponen UI — Class Referensi

### Card

```tsx
// Standard card
<div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">

// Interactive card (klikable)
<div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 
                transition-shadow hover:shadow-md cursor-pointer">

// Highlight card (aktif/selected)
<div className="rounded-2xl bg-emerald-50 p-6 ring-2 ring-emerald-500">
```

### Input

```tsx
<input
  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 
             text-sm text-gray-900 placeholder:text-gray-400
             focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
             disabled:bg-gray-50 disabled:text-gray-400"
/>
```

### Badge

```tsx
// Mapping variant → class (di Badge.tsx)
const badgeVariants = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-sky-100 text-sky-700',
  neutral: 'bg-gray-100 text-gray-600',
}

// Base class
'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
```

### Divider

```tsx
<hr className="border-gray-100" />
```

---

## 6. Responsive Breakpoints

Gunakan pendekatan **mobile-first**:

```
sm  → 640px   (tidak sering dipakai)
md  → 768px   (tablet, mulai layout 2 kolom)
lg  → 1024px  (desktop, layout penuh)
xl  → 1280px  (jarang)
```

```tsx
// Contoh: grid responsive
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

// Contoh: sidebar layout
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64 lg:shrink-0">...</aside>
  <main className="flex-1">...</main>
</div>
```

---

## 7. Dark Mode

**Belum diimplementasikan** di versi awal. Jangan tambahkan class `dark:` sampai ada keputusan desain. Semua UI menggunakan light mode.

---

## 8. Animasi via Tailwind (CSS)

Untuk animasi sederhana yang tidak perlu Framer Motion:

```tsx
// Fade in
<div className="animate-fade-in">

// Spin (loading)
<div className="animate-spin">

// Pulse (skeleton loading)
<div className="animate-pulse bg-gray-200 rounded-xl h-4 w-full">

// Transition (hover/focus)
<button className="transition-colors duration-150 hover:bg-emerald-700">
```

Untuk animasi yang lebih kompleks (masuk/keluar, gesture, stagger), lihat **SOP-09-animation.md**.

---

## 9. Larangan

- ❌ `style={{}}` inline — selalu gunakan Tailwind class
- ❌ File `.module.css` — tidak ada CSS Module di proyek ini
- ❌ Arbitrary value `[]` kecuali benar-benar tidak ada alternatif Tailwind
- ❌ Campur `className` string template literal dengan `cn()` dalam satu ekspresi
- ❌ `!important` / `!` prefix Tailwind (kecuali benar-benar terdesak)
