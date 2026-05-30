# SOP-02 — Naming Conventions

> **Aturan**: Konsistensi penamaan adalah fondasi proyek ini. Semua nama harus **deskriptif**, **prediktabel**, dan **mengikuti pola di bawah**.

---

## 1. File & Folder

| Jenis | Pola | Contoh |
|-------|------|--------|
| Komponen React | `PascalCase.tsx` | `ScoreCard.tsx`, `OtpForm.tsx` |
| Custom hook | `useCamelCase.ts` | `useQuiz.ts`, `useEisScore.ts` |
| Service | `camelCase.service.ts` | `auth.service.ts` |
| Type definition | `camelCase.types.ts` | `quiz.types.ts` |
| Utility/helper | `camelCase.ts` | `format.ts`, `token.ts` |
| Konstanta | `kebab-case.ts` | `api-endpoints.ts`, `routes.ts` |
| Next.js pages | **lowercase** (wajib) | `page.tsx`, `layout.tsx`, `error.tsx` |
| Route group | `(camelCase)` | `(auth)`, `(visitor)`, `(admin)` |
| Dynamic segment | `[camelCase]` | `[token]`, `[exhibit_id]` |

---

## 2. Komponen React

```ts
// BENAR — PascalCase, nama mendeskripsikan FUNGSI bukan tampilan
export function QuizQuestion({ ... }: QuizQuestionProps) {}
export function ScoreCard({ ... }: ScoreCardProps) {}
export function ExhibitCard({ ... }: ExhibitCardProps) {}

// SALAH
export function quiz_question() {}   // snake_case
export function Card2() {}           // angka
export function BlueCard() {}        // nama warna / tampilan
export default function() {}         // anonymous default export
```

**Aturan ekspor komponen:**
- Komponen **SELALU** menggunakan **named export** (bukan default export)
- Exception: file `page.tsx` dan `layout.tsx` di App Router **WAJIB** default export (syarat Next.js)

```ts
// page.tsx — WAJIB default export
export default function DashboardPage() {}

// Komponen biasa — WAJIB named export
export function DashboardStats() {}
```

---

## 3. Props Interface

```ts
// Pola: [NamaKomponen]Props
interface QuizQuestionProps {
  question: Question
  index: number
  onAnswer: (questionId: string, answer: string) => void
}

interface ScoreCardProps {
  score: EisScore
  className?: string  // className selalu optional, selalu string
}
```

---

## 4. Custom Hooks

```ts
// Pola: use[Domain][Action?]
// Selalu return objek (bukan array) kecuali hook sangat sederhana

// BENAR
function useQuiz() {
  return { questions, isLoading, error, submitAnswer, fetchQuiz }
}

function useSession() {
  return { session, isLoading, startSession, endSession }
}

// SALAH
function getQuizData() {}     // tidak pakai prefix 'use'
function useQuiz() {
  return [questions, loading]  // return array (susah dibaca)
}
```

---

## 5. Variabel & Fungsi

```ts
// Variabel: camelCase, deskriptif
const userQuizAttempt = ...
const isSessionActive = ...
const hasCompletedPreZoo = ...

// Boolean: selalu prefix is/has/can/should
const isLoading = false
const hasError = false
const canSubmit = true
const shouldRedirect = false

// Event handler: selalu prefix handle
function handleSubmit() {}
function handleAnswerSelect(answerId: string) {}
function handleCheckin(qrCode: string) {}

// SALAH
const loading = false          // tidak prefix is
function submit() {}           // tidak prefix handle
function clickHandler() {}     // suffix Handler (bukan prefix)
```

---

## 6. Konstanta

```ts
// Konstanta app: SCREAMING_SNAKE_CASE
export const MAX_OTP_ATTEMPTS = 3
export const SESSION_STORAGE_KEY = 'eis_session'
export const JWT_LOCAL_STORAGE_KEY = 'eis_token'

// Object konstanta: PascalCase dengan as const
export const QuizType = {
  PRE_ZOO: 'PRE_ZOO',
  POST_ZOO: 'POST_ZOO',
  RETENTION_1W: 'RETENTION_1W',
  RETENTION_1M: 'RETENTION_1M',
} as const

export type QuizType = typeof QuizType[keyof typeof QuizType]
```

---

## 7. TypeScript Types & Interfaces

```ts
// Interface: PascalCase, noun
interface User {}
interface Exhibit {}
interface QuizAttempt {}

// Type alias: PascalCase
type ApiResponse<T> = { data: T; message: string; success: boolean }
type QuizType = 'PRE_ZOO' | 'POST_ZOO' | 'RETENTION_1W' | 'RETENTION_1M'
type UserRole = 'visitor' | 'admin'

// Generic: huruf kapital bermakna
type ApiResponse<TData>    // T untuk Data
type PaginatedList<TItem>  // bukan hanya T

// JANGAN gunakan:
type IUser = {}      // prefix I (gaya Java/C#, tidak dipakai di sini)
type UserType = {}   // suffix Type (redundant)
```

---

## 8. CSS Class & Tailwind

```tsx
// Gunakan cn() dari lib/cn.ts untuk conditional class
import { cn } from '@/lib/cn'

// BENAR
<div className={cn('flex items-center gap-2', isActive && 'bg-green-100')}>

// SALAH
<div className={`flex items-center gap-2 ${isActive ? 'bg-green-100' : ''}`}>
<div style={{ display: 'flex' }}>  // inline style
```

---

## 9. API Endpoint Constants

```ts
// src/constants/api-endpoints.ts
// Pola: objek dengan domain sebagai key

export const API = {
  users: {
    register:   '/users/register',
    requestOtp: '/users/request-otp',
    verifyOtp:  '/users/verify-otp',
    profile:    '/users/profile',
  },
  sessions: {
    start:   '/sessions/start',
    end:     '/sessions/end',
    history: '/sessions/history',
  },
  quizzes: {
    fetch:           '/quizzes/fetch',
    submit:          '/quizzes/submit',
    result:          (sessionId: string) => `/quizzes/result/${sessionId}`,
    retentionStatus: '/quizzes/retention-status',
  },
  track: {
    checkin:  '/track/checkin',
    interact: '/track/interact',
    labLog:   '/track/lab-log',
    checkout: '/track/checkout',
  },
  retention: {
    trigger: '/retention/trigger',
    quiz:    (token: string) => `/retention/quiz/${token}`,
    submit:  (token: string) => `/retention/submit/${token}`,
  },
  analytics: {
    eis:       (userId: string) => `/analytics/eis/${userId}`,
    session:   (sessionId: string) => `/analytics/session/${sessionId}`,
    dashboard: '/analytics/dashboard',
  },
  admin: {
    exhibits:       '/admin/exhibits',
    exhibitById:    (exhibitId: string) => `/admin/exhibits/${exhibitId}`,
    content:        '/admin/content',
    media:          '/admin/media',
    quizzes:        '/admin/quizzes',
  },
} as const
```

---

## 10. Route Constants

```ts
// src/constants/routes.ts
export const ROUTES = {
  // Auth
  login:    '/login',
  register: '/register',

  // Visitor
  dashboard: '/dashboard',
  checkin:   '/checkin',
  session:   '/session',
  score:     '/score',
  quiz: {
    preZoo:  '/quiz/pre-zoo',
    postZoo: '/quiz/post-zoo',
    result:  '/quiz/result',
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    exhibits:  '/admin/exhibits',
    content:   '/admin/content',
    media:     '/admin/media',
    quizzes:   '/admin/quizzes',
  },

  // Retention (public)
  retention: (token: string) => `/retention/${token}`,
} as const
```
