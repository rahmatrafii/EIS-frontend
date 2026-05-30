# SOP-03 — Component Architecture

> **Prinsip**: Server Component by default. Gunakan Client Component **hanya jika ada alasan teknis yang jelas**.

---

## 1. Kapan Server vs Client Component

### Server Component (default, tanpa directive)

Gunakan ketika komponen:
- Hanya menampilkan data (tidak ada interaksi user)
- Melakukan fetch data langsung (di masa depan bisa pakai Server Action)
- Mengakses environment variable server-only
- Tidak menggunakan: `useState`, `useEffect`, `useContext`, event listener

```tsx
// src/components/visitor/ScoreCard.tsx
// Tidak ada 'use client' → ini Server Component

import { EisScore } from '@/types/analytics.types'
import { Badge } from '@/components/ui/Badge'
import { formatScore } from '@/lib/format'

interface ScoreCardProps {
  score: EisScore
  className?: string
}

export function ScoreCard({ score, className }: ScoreCardProps) {
  return (
    <div className={cn('rounded-2xl bg-white p-6 shadow-sm', className)}>
      <h2 className="text-sm font-medium text-gray-500">EIS Score Anda</h2>
      <p className="mt-1 text-4xl font-bold text-emerald-600">
        {formatScore(score.total_score)}
      </p>
      <Badge variant="success">{score.category}</Badge>
    </div>
  )
}
```

### Client Component (`'use client'`)

Gunakan ketika komponen:
- Menggunakan `useState`, `useReducer`, `useEffect`
- Menggunakan browser API (`window`, `navigator`, `localStorage`)
- Menggunakan event handler (onClick, onChange, dll)
- Menggunakan custom hook yang punya state
- Menggunakan Framer Motion animation yang interaktif

```tsx
// src/components/visitor/QrScanner.tsx
'use client'

import { useState } from 'react'
import { useCheckin } from '@/hooks/useCheckin'

interface QrScannerProps {
  onSuccess: (exhibitName: string) => void
}

export function QrScanner({ onSuccess }: QrScannerProps) {
  const [qrCode, setQrCode] = useState('')
  const { checkin, isLoading, error } = useCheckin()

  async function handleScan() {
    const result = await checkin(qrCode)
    if (result) onSuccess(result.exhibit.name)
  }

  return (
    // ...
  )
}
```

---

## 2. Struktur Anatomi Komponen

Urutan penulisan kode dalam sebuah file komponen **WAJIB** mengikuti urutan ini:

```tsx
// 1. Directive (jika Client Component)
'use client'

// 2. Import — diurutkan:
//    a. React / Next.js
//    b. Library eksternal
//    c. Internal absolut (@ alias)
//    d. Relatif (jarang dipakai)
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

import { useQuiz } from '@/hooks/useQuiz'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { Question } from '@/types/quiz.types'

// 3. Type/Interface Props (lokal, di file ini)
interface QuizQuestionProps {
  question: Question
  index: number
  selectedAnswer?: string
  onSelect: (answerId: string) => void
}

// 4. Konstanta lokal komponen (jika ada)
const ANSWER_LABELS = ['A', 'B', 'C', 'D'] as const

// 5. Komponen utama
export function QuizQuestion({
  question,
  index,
  selectedAnswer,
  onSelect,
}: QuizQuestionProps) {
  // 5a. Hooks (urut: state → context/custom hook → efek)
  const [isAnimating, setIsAnimating] = useState(false)

  // 5b. Derived state / computed values
  const hasSelected = selectedAnswer !== undefined

  // 5c. Event handlers
  function handleAnswerClick(answerId: string) {
    setIsAnimating(true)
    onSelect(answerId)
  }

  // 5d. JSX return
  return (
    <div className="space-y-4">
      {/* ... */}
    </div>
  )
}

// 6. Sub-komponen kecil yang HANYA dipakai di file ini (opsional)
function AnswerOption({ label, text, isSelected, onClick }: AnswerOptionProps) {
  return <button onClick={onClick}>{/* ... */}</button>
}
```

---

## 3. Pola Komposisi Komponen

### ✅ DO: Pisahkan tanggung jawab

```tsx
// page.tsx — hanya orchestration
export default async function ScorePage() {
  return (
    <main>
      <PageHeader title="Hasil EIS Score" />
      <ScorePageContent />  {/* client component yang fetch data */}
    </main>
  )
}

// ScorePageContent.tsx — 'use client', handle data fetching & state
'use client'
export function ScorePageContent() {
  const { score, isLoading, error } = useEisScore()
  if (isLoading) return <Spinner />
  if (error) return <ErrorState message={error} />
  if (!score) return <EmptyState message="Score belum tersedia" />
  return <ScoreCard score={score} />
}
```

### ❌ DON'T: Semua logika di page.tsx

```tsx
// SALAH — jangan taruh state, fetch, dan UI sekaligus di page
export default function ScorePage() {
  const [score, setScore] = useState(null)
  useEffect(() => { fetch('/api/score').then(...) }, [])
  return <div>{score ? <div>{score.total}</div> : <div>loading</div>}</div>
}
```

---

## 4. Prop Drilling vs Context

- **Maksimal 2 level prop drilling** — jika lebih, gunakan Context atau pindahkan state ke parent yang lebih tinggi
- Context hanya untuk state **benar-benar global**: auth user, toast notifications
- Jangan buat context untuk setiap fitur

---

## 5. Komponen UI Primitif (`src/components/ui/`)

Komponen di folder `ui/` adalah **building blocks murni**:
- Tidak ada fetch data
- Tidak ada custom hook (kecuali animasi sederhana)
- Semua perilaku dikontrol via props
- Selalu punya prop `className?: string` untuk ekstensibilitas

```tsx
// src/components/ui/Button.tsx
import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors',
        {
          'bg-emerald-600 text-white hover:bg-emerald-700': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
          'bg-transparent text-gray-600 hover:bg-gray-100': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
        },
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-sm': size === 'md',
          'h-12 px-6 text-base': size === 'lg',
        },
        (disabled || isLoading) && 'cursor-not-allowed opacity-60',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : children}
    </button>
  )
}
```

---

## 6. Loading, Error, Empty State — WAJIB Ada

Setiap komponen yang menampilkan data async **WAJIB** menangani 4 kondisi:

```tsx
export function ExhibitList() {
  const { exhibits, isLoading, error } = useExhibits()

  // 1. Loading
  if (isLoading) return <Spinner className="mx-auto mt-8" />

  // 2. Error
  if (error) return <ErrorState message={error} onRetry={refetch} />

  // 3. Empty
  if (exhibits.length === 0) {
    return <EmptyState message="Belum ada exhibit yang tersedia" />
  }

  // 4. Success
  return (
    <ul className="grid gap-4">
      {exhibits.map((exhibit) => (
        <ExhibitCard key={exhibit.id} exhibit={exhibit} />
      ))}
    </ul>
  )
}
```
