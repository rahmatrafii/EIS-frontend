# SOP-10 — TypeScript

> **Mode**: Strict mode aktif. Tidak ada `any`. Tidak ada `as unknown as X`.

---

## 1. tsconfig.json (Referensi)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "incremental": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "plugins": [{ "name": "next" }]
  }
}
```

---

## 2. Tipe API Response

```ts
// src/types/api.types.ts

// Generic response shape dari backend
export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

// Shape error dari backend
export type ApiErrorShape = {
  success: false
  message: string
  errors?: Record<string, string[]>
}

// Result dari wrapper fetch kita (bukan dari backend langsung)
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; statusCode: number; errors?: Record<string, string[]> } }
```

---

## 3. Tipe Domain

```ts
// src/types/user.types.ts
export type UserRole = 'visitor' | 'admin'

export interface UserProfile {
  id: number
  name: string
  email: string
  age: number
  role: UserRole
  created_at: string
}

export interface RegisterPayload {
  name: string
  email: string
  age: number
}

export interface VerifyOtpPayload {
  email: string
  otp: string
}
```

```ts
// src/types/exhibit.types.ts
export type MediaType = 'audio' | 'video' | 'infographic'
export type AgeCategory = 'CHILD' | 'TEEN' | 'ADULT'

export interface Exhibit {
  id: number
  name: string
  description: string
  qr_code: string
  location: string
  created_at: string
}

export interface ExhibitMedia {
  id: number
  exhibit_id: number
  type: MediaType
  url: string
  title: string
  age_category: AgeCategory
}

export interface LearningPathContent {
  id: number
  exhibit_id: number
  title: string
  body: string
  age_category: AgeCategory
}
```

```ts
// src/types/session.types.ts
export type SessionStatus = 'active' | 'completed'

export interface VisitSession {
  id: number
  user_id: number
  status: SessionStatus
  started_at: string
  ended_at: string | null
}
```

```ts
// src/types/quiz.types.ts
export type QuizType = 'PRE_ZOO' | 'POST_ZOO' | 'RETENTION_1W' | 'RETENTION_1M'
export type QuizScope = 'GLOBAL' | 'EXHIBIT'

export interface Question {
  id: number
  text: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
}

export interface Quiz {
  id: number
  title: string
  type: QuizType
  scope: QuizScope
  exhibit_id: number | null
  questions: Question[]
}

export interface QuizSubmitPayload {
  quiz_id: number
  session_id: number
  answers: Array<{ question_id: number; answer: 'A' | 'B' | 'C' | 'D' }>
}

export interface QuizResult {
  attempt_id: number
  score: number
  total_questions: number
  correct_answers: number
  completed_at: string
}

export type RetentionStatus = {
  has_week_1: boolean
  has_month_1: boolean
  week_1_completed: boolean
  month_1_completed: boolean
}
```

```ts
// src/types/tracking.types.ts
export type MediaInteractionType = 'audio' | 'video' | 'infographic'

export interface CheckinPayload {
  qr_code: string
  session_id: number
}

export interface CheckinResult {
  interaction_id: number
  exhibit: Exhibit
}

export interface InteractPayload {
  interaction_id: number
  media_type: MediaInteractionType
  media_id: number
}

export interface LabLogPayload {
  interaction_id: number
  score: number
  activity_name: string
}

export interface CheckoutPayload {
  interaction_id: number
}
```

```ts
// src/types/analytics.types.ts
export interface EisScore {
  id: number
  user_id: number
  session_id: number
  knowledge_gain_score: number
  engagement_score: number
  retention_score: number
  total_score: number
  category: 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi'
  calculated_at: string
}

export interface SessionAnalytics {
  session: VisitSession
  exhibits_visited: number
  total_duration_minutes: number
  quiz_scores: QuizResult[]
  eis_score: EisScore | null
}

export interface AdminDashboard {
  total_visitors: number
  active_sessions: number
  avg_eis_score: number
  top_exhibits: Array<{ exhibit: Exhibit; visit_count: number }>
  score_distribution: Record<EisScore['category'], number>
}
```

```ts
// src/types/admin.types.ts
export interface CreateExhibitPayload {
  name: string
  description: string
  location: string
}

export interface CreateContentPayload {
  exhibit_id: string
  title: string
  body: string
  age_category: AgeCategory
}

export interface CreateQuizPayload {
  title: string
  type: QuizType
  scope: QuizScope
  exhibit_id?: string
  questions: Array<{
    text: string
    options: { A: string; B: string; C: string; D: string }
    correct_answer: 'A' | 'B' | 'C' | 'D'
  }>
}
```

---

## 4. Aturan TypeScript

### ❌ Dilarang Keras

```ts
// any
const data: any = response.data  // ❌

// as unknown
const user = response as unknown as UserProfile  // ❌

// non-null assertion sembarangan
const token = getToken()!  // ❌ — handle null dengan benar

// @ts-ignore
// @ts-expect-error  // ❌ kecuali ada komentar jelas mengapa
```

### ✅ Cara Benar

```ts
// Type guard
function isApiError(value: unknown): value is ApiErrorShape {
  return typeof value === 'object' && value !== null && 'message' in value
}

// Optional chaining & nullish coalescing
const score = user?.eis_score ?? 0

// Type narrowing
if (result.success) {
  // di sini result.data sudah aman diakses
  console.log(result.data)
}
```

---

## 5. Import Type

Selalu gunakan `import type` untuk import yang hanya dibutuhkan untuk tipe:

```ts
// BENAR
import type { UserProfile } from '@/types/user.types'
import type { ReactNode } from 'react'

// SALAH (jika hanya dipakai sebagai tipe)
import { UserProfile } from '@/types/user.types'
```

---

## 6. Generics

```ts
// Gunakan nama yang bermakna, bukan hanya T
type PaginatedResponse<TItem> = {
  items: TItem[]
  total: number
  page: number
  limit: number
}

// Constraint generic
function getById<TItem extends { id: string }>(items: TItem[], id: string): TItem | undefined {
  return items.find((item) => item.id === id)
}
```
