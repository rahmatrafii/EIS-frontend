# SOP-04 — API Integration

> **Aturan utama**: Semua pemanggilan API melewati satu **base fetch wrapper** (`src/services/api.ts`). Tidak ada `fetch()` langsung di komponen atau hook.

---

## 1. Base Fetch Wrapper

```ts
// src/services/api.ts
import { API_BASE_URL } from '@/constants/env'
import { getToken } from '@/lib/token'

export type ApiError = {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  isPublic?: boolean  // jika true, tidak kirim Authorization header
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const { method = 'GET', body, isPublic = false } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (!isPublic) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const json = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: json.message ?? 'Terjadi kesalahan pada server',
          statusCode: response.status,
          errors: json.errors,
        },
      }
    }

    return { success: true, data: json.data ?? json }
  } catch {
    return {
      success: false,
      error: {
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        statusCode: 0,
      },
    }
  }
}
```

---

## 2. Service Functions

Setiap domain memiliki file service sendiri. Service function adalah **fungsi async murni** — tidak ada state, tidak ada hook.

```ts
// src/services/auth.service.ts
import { apiRequest } from './api'
import { API } from '@/constants/api-endpoints'
import type { RegisterPayload, VerifyOtpPayload, UserProfile } from '@/types/user.types'

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<{ userId: string }>(API.users.register, {
    method: 'POST',
    body: payload,
    isPublic: true,
  })
}

export async function requestOtp(email: string) {
  return apiRequest<{ message: string }>(API.users.requestOtp, {
    method: 'POST',
    body: { email },
    isPublic: true,
  })
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  return apiRequest<{ token: string; user: UserProfile }>(API.users.verifyOtp, {
    method: 'POST',
    body: payload,
    isPublic: true,
  })
}

export async function getUserProfile() {
  return apiRequest<UserProfile>(API.users.profile)
}
```

```ts
// src/services/quiz.service.ts
import { apiRequest } from './api'
import { API } from '@/constants/api-endpoints'
import type { Quiz, QuizSubmitPayload, QuizResult } from '@/types/quiz.types'

export async function fetchQuiz(type: string, sessionId: string) {
  return apiRequest<Quiz>(`${API.quizzes.fetch}?type=${type}&session_id=${sessionId}`)
}

export async function submitQuiz(payload: QuizSubmitPayload) {
  return apiRequest<QuizResult>(API.quizzes.submit, {
    method: 'POST',
    body: payload,
  })
}

export async function getQuizResult(sessionId: string) {
  return apiRequest<QuizResult>(API.quizzes.result(sessionId))
}

export async function getRetentionStatus() {
  return apiRequest<RetentionStatus>(API.quizzes.retentionStatus)
}
```

---

## 3. Pola Penggunaan di Hook

```ts
// src/hooks/useQuiz.ts
'use client'  // (jika hook dipakai di client component)

import { useState } from 'react'
import { fetchQuiz, submitQuiz } from '@/services/quiz.service'
import type { Quiz, QuizSubmitPayload } from '@/types/quiz.types'

export function useQuiz(type: string, sessionId: string) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadQuiz() {
    setIsLoading(true)
    setError(null)

    const result = await fetchQuiz(type, sessionId)

    if (result.success) {
      setQuiz(result.data)
    } else {
      setError(result.error.message)
    }

    setIsLoading(false)
  }

  async function handleSubmit(payload: QuizSubmitPayload) {
    setIsLoading(true)
    setError(null)

    const result = await submitQuiz(payload)

    setIsLoading(false)

    if (!result.success) {
      setError(result.error.message)
      return null
    }

    return result.data
  }

  return { quiz, isLoading, error, loadQuiz, handleSubmit }
}
```

---

## 4. Daftar Lengkap Endpoint & Service yang Dipetakan

### Users & Auth
| Endpoint | Method | Service Function | Auth |
|----------|--------|-----------------|------|
| `/users/register` | POST | `registerUser(payload)` | Public |
| `/users/request-otp` | POST | `requestOtp(email)` | Public |
| `/users/verify-otp` | POST | `verifyOtp(payload)` | Public |
| `/users/profile` | GET | `getUserProfile()` | Bearer |

### Visit Sessions
| Endpoint | Method | Service Function | Auth |
|----------|--------|-----------------|------|
| `/sessions/start` | POST | `startSession()` | Bearer |
| `/sessions/end` | POST | `endSession(sessionId)` | Bearer |
| `/sessions/history` | GET | `getSessionHistory()` | Bearer |

### Quizzes
| Endpoint | Method | Service Function | Auth |
|----------|--------|-----------------|------|
| `/quizzes/fetch` | GET | `fetchQuiz(type, sessionId)` | Bearer |
| `/quizzes/submit` | POST | `submitQuiz(payload)` | Bearer |
| `/quizzes/result/:session_id` | GET | `getQuizResult(sessionId)` | Bearer |
| `/quizzes/retention-status` | GET | `getRetentionStatus()` | Bearer |

### Tracking
| Endpoint | Method | Service Function | Auth |
|----------|--------|-----------------|------|
| `/track/checkin` | POST | `checkinExhibit(qrCode, sessionId)` | Bearer |
| `/track/interact` | PATCH | `recordInteraction(payload)` | Bearer |
| `/track/lab-log` | POST | `submitLabLog(payload)` | Bearer |
| `/track/checkout` | POST | `checkoutExhibit(interactionId)` | Bearer |

### Retention
| Endpoint | Method | Service Function | Auth |
|----------|--------|-----------------|------|
| `/retention/trigger` | POST | `triggerRetention()` | Bearer |
| `/retention/quiz/:token` | GET | `getRetentionQuiz(token)` | Public |
| `/retention/submit/:token` | POST | `submitRetentionQuiz(token, payload)` | Public |

### Analytics
| Endpoint | Method | Service Function | Auth |
|----------|--------|-----------------|------|
| `/analytics/eis/:user_id` | GET | `getEisScore(userId)` | Bearer |
| `/analytics/session/:session_id` | GET | `getSessionAnalytics(sessionId)` | Bearer |
| `/analytics/dashboard` | GET | `getDashboard()` | Bearer (admin) |

### Admin
| Endpoint | Method | Service Function | Auth |
|----------|--------|-----------------|------|
| `/admin/exhibits` | POST | `createExhibit(payload)` | Bearer (admin) |
| `/admin/exhibits` | GET | `getExhibits()` | Bearer (admin) |
| `/admin/exhibits/:id` | DELETE | `deleteExhibit(exhibitId)` | Bearer (admin) |
| `/admin/content` | POST | `createContent(payload)` | Bearer (admin) |
| `/admin/media` | POST | `uploadMedia(formData)` | Bearer (admin) |
| `/admin/quizzes` | POST | `createQuiz(payload)` | Bearer (admin) |

---

## 5. Upload File (Multipart)

Untuk upload media ke `/admin/media`, gunakan `FormData` bukan JSON:

```ts
// src/services/admin.service.ts
export async function uploadMedia(file: File, exhibitId: string) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('exhibit_id', exhibitId)

  // Untuk FormData, JANGAN set Content-Type (browser set otomatis dengan boundary)
  const response = await fetch(`${API_BASE_URL}${API.admin.media}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  })

  const json = await response.json()
  if (!response.ok) {
    return { success: false, error: { message: json.message, statusCode: response.status } }
  }
  return { success: true, data: json.data }
}
```

---

## 6. Aturan Tambahan

- **Jangan** simpan response API langsung ke `localStorage` (kecuali token)
- **Jangan** retry otomatis — biarkan user yang memutuskan untuk mencoba lagi
- **Selalu** destructure `result.success` sebelum mengakses `result.data`
- **Selalu** handle status 401 → redirect ke halaman login (dihandle di middleware)
- Query parameter dibangun di dalam service function, bukan di komponen
