# SOP-11 — Error Handling

> **Prinsip**: Error tidak boleh diam-diam gagal. Setiap error harus tampil ke user dalam bentuk yang informatif dan actionable.

---

## 1. Lapisan Error Handling

```
1. API Error       → ditangkap di apiRequest(), dikembalikan sebagai ApiResult
2. Component Error → ditangkap oleh ErrorBoundary (error.tsx)
3. Form Error      → ditampilkan di bawah field input
4. Toast Error     → untuk error umum yang tidak terkait field
5. Empty State     → ketika data kosong (bukan error, tapi perlu ditangani)
```

---

## 2. Error State Komponen Standar

```tsx
// src/components/ui/ErrorState.tsx
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  message = 'Terjadi kesalahan. Silakan coba lagi.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl',
        'border border-red-100 bg-red-50 p-8 text-center',
        className
      )}
    >
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  )
}
```

```tsx
// src/components/ui/EmptyState.tsx
import { PackageOpen } from 'lucide-react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  message?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  message = 'Belum ada data',
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl',
        'border border-dashed border-gray-200 bg-gray-50 p-12 text-center',
        className
      )}
    >
      <PackageOpen className="h-8 w-8 text-gray-300" />
      <p className="font-medium text-gray-500">{message}</p>
      {description && <p className="text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
```

---

## 3. Next.js Error Boundary

```tsx
// src/app/error.tsx — global error boundary
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log ke error monitoring service jika ada
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-bold text-gray-900">Ada yang tidak beres</h1>
      <p className="text-sm text-gray-500">
        {error.message || 'Terjadi kesalahan yang tidak terduga.'}
      </p>
      <Button onClick={reset}>Muat Ulang Halaman</Button>
    </div>
  )
}
```

```tsx
// src/app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">Halaman tidak ditemukan.</p>
      <Button asChild>
        <Link href={ROUTES.dashboard}>Kembali ke Beranda</Link>
      </Button>
    </div>
  )
}
```

---

## 4. Toast Notification

Gunakan untuk feedback aksi user (berhasil/gagal) yang bersifat sementara.

```tsx
// src/components/ui/ToastContainer.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToast } from '@/stores/ToastContext'
import { cn } from '@/lib/cn'

const TOAST_ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}

const TOAST_STYLES = {
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  error:   'bg-red-50 text-red-800 ring-red-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  info:    'bg-sky-50 text-sky-800 ring-sky-200',
}

export function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type]
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'flex max-w-sm items-start gap-3 rounded-xl px-4 py-3',
                'text-sm font-medium shadow-lg ring-1',
                TOAST_STYLES[toast.type]
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{toast.message}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
```

---

## 5. Pola Error Handling di Hook

```ts
// Setiap async action di hook mengikuti pola ini:
async function handleAction() {
  setIsLoading(true)
  setError(null)  // selalu reset error sebelum action baru

  const result = await someServiceCall()

  setIsLoading(false)

  if (!result.success) {
    setError(result.error.message)
    return null  // atau return false
  }

  // handle success
  return result.data
}
```

---

## 6. Error Message — Panduan Bahasa

Semua pesan error menggunakan **Bahasa Indonesia** yang ramah:

| Situasi | Pesan |
|---------|-------|
| Koneksi gagal | "Tidak dapat terhubung ke server. Periksa koneksi internet Anda." |
| Server error (500) | "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi." |
| Tidak ditemukan (404) | "Data tidak ditemukan." |
| Token expired (401) | "Sesi Anda telah berakhir. Silakan login kembali." |
| Akses ditolak (403) | "Anda tidak memiliki akses ke halaman ini." |
| Validasi gagal (400) | Tampilkan pesan spesifik dari `result.error.errors` |
| Field kosong | "... tidak boleh kosong" |
| Format salah | "Format ... tidak valid" |

---

## 7. Checklist Error Handling

Sebelum menganggap fitur selesai, pastikan:

- [ ] Loading state ditampilkan saat fetch berlangsung
- [ ] Error state ditampilkan jika fetch gagal (dengan pesan spesifik)
- [ ] Empty state ditampilkan jika data kosong
- [ ] Tombol "Coba Lagi" ada jika fetch bisa diulang
- [ ] Form errors ditampilkan per field, bukan hanya toast
- [ ] Error 401 selalu redirect ke halaman login
- [ ] Tidak ada `console.error` tanpa penanganan yang terlihat oleh user
