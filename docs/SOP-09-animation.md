# SOP-09 — Animation

> **Library**: Framer Motion `^12`. Digunakan untuk animasi yang butuh kontrol (mount/unmount, gesture, stagger). Animasi sederhana (hover, transition) cukup dengan Tailwind CSS.

---

## 1. Kapan Pakai Framer Motion vs Tailwind

| Situasi | Gunakan |
|---------|---------|
| Hover state sederhana | Tailwind `hover:` + `transition-` |
| Focus ring, warna berubah | Tailwind |
| Elemen muncul/hilang dari DOM (mount/unmount) | Framer Motion `AnimatePresence` |
| List item muncul berurutan (stagger) | Framer Motion |
| Drag & drop | Framer Motion |
| Progress bar animasi | Framer Motion |
| Page transition | Framer Motion |
| Skeleton loading | Tailwind `animate-pulse` |

---

## 2. Reusable Animation Variants

Semua variant Framer Motion yang dipakai berulang disimpan di satu file:

```ts
// src/lib/animations.ts
import type { Variants } from 'framer-motion'

// Fade in sederhana
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

// Fade + slide dari bawah (untuk card, modal)
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}

// Fade + slide dari kanan (untuk slide-over, panel samping)
export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: { opacity: 0, x: 24, transition: { duration: 0.2 } },
}

// Container untuk stagger anak-anaknya
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

// Item anak untuk stagger (dipakai dengan staggerContainer)
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
}

// Scale in (untuk modal, popup)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
}

// Progress/score number animasi
export const progressBar: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (value: number) => ({
    scaleX: value / 100,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
  }),
}
```

---

## 3. Cara Pakai Variant

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

// Fade in elemen tunggal
export function ScoreCard({ score }: ScoreCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl bg-white p-6"
    >
      {/* ... */}
    </motion.div>
  )
}

// Stagger list
export function ExhibitList({ exhibits }: ExhibitListProps) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4"
    >
      {exhibits.map((exhibit) => (
        <motion.li key={exhibit.id} variants={staggerItem}>
          <ExhibitCard exhibit={exhibit} />
        </motion.li>
      ))}
    </motion.ul>
  )
}

// AnimatePresence untuk mount/unmount
export function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          {/* Modal content */}
          <motion.div
            key="modal"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-2xl bg-white p-6"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## 4. Page Transition

```tsx
// Wrap konten page dengan ini untuk transisi halaman
// src/components/layout/PageTransition.tsx
'use client'

import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations'
import type { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}
```

Pakai di setiap `page.tsx` yang membutuhkan transisi:
```tsx
export default function DashboardPage() {
  return (
    <PageTransition>
      <main>...</main>
    </PageTransition>
  )
}
```

---

## 5. Score / Progress Animasi (Khas EIS)

```tsx
'use client'

import { motion } from 'framer-motion'

interface EisProgressBarProps {
  score: number  // 0–100
  label: string
  color?: string
}

export function EisProgressBar({
  score,
  label,
  color = 'bg-emerald-500'
}: EisProgressBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </div>
    </div>
  )
}
```

---

## 6. Aturan Animasi

- ✅ Selalu import variant dari `@/lib/animations` — jangan definisikan variant inline di komponen
- ✅ Durasi animasi: entri 0.3–0.5s, exit 0.15–0.25s (exit lebih cepat dari entri)
- ✅ Easing: gunakan `[0.16, 1, 0.3, 1]` (ease out expo) sebagai default — terasa natural
- ❌ Jangan animasi lebih dari 3 properti sekaligus
- ❌ Jangan gunakan `spring` untuk animasi layout (gunakan `duration` + `ease`)
- ❌ Jangan tambahkan animasi pada elemen yang tidak terlihat user (di bawah fold)
- ❌ Jangan lupa `AnimatePresence` untuk animasi exit — tanpanya exit tidak akan teranimasikan
