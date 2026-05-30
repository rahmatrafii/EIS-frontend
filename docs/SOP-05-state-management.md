# SOP-05 — State Management

> **Prinsip**: Gunakan state sesederhana mungkin. Jangan pakai solusi global untuk masalah lokal.

---

## 1. Hierarki State (pilih dari paling sederhana)

```
1. URL State (searchParams / router)     ← untuk filter, tab, ID yang perlu shareable
2. useState lokal                        ← untuk UI state sederhana di satu komponen
3. Custom Hook (encapsulasi useState)    ← untuk state dengan logika kompleks
4. React Context                         ← hanya untuk: auth user & toast global
5. ❌ Jangan tambah library state       ← tidak ada Zustand/Redux/Jotai
```

---

## 2. URL State

Gunakan untuk state yang perlu di-bookmark / di-share / bertahan saat refresh.

```tsx
// src/app/(admin)/admin/exhibits/page.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export default function ExhibitsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentPage = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('q') ?? ''

  function handleSearch(query: string) {
    const params = new URLSearchParams(searchParams)
    params.set('q', query)
    params.set('page', '1')
    router.replace(`/admin/exhibits?${params.toString()}`)
  }

  return (/* ... */)
}
```

---

## 3. useState Lokal

Gunakan untuk state yang tidak perlu keluar dari komponen.

```tsx
// Tepat untuk: toggle modal, tab aktif, nilai input terkontrol
'use client'

export function ExhibitCard({ exhibit }: ExhibitCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      <button onClick={() => setIsExpanded(!isExpanded)}>Detail</button>
      {isExpanded && <ExhibitDetail exhibit={exhibit} />}
    </div>
  )
}
```

---

## 4. Custom Hook — Pola Standar

Semua hook yang berhubungan dengan data async mengikuti pola ini:

```ts
// src/hooks/useSession.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { startSession, endSession, getSessionHistory } from '@/services/session.service'
import type { VisitSession } from '@/types/session.types'

export function useSession() {
  const [activeSession, setActiveSession] = useState<VisitSession | null>(null)
  const [history, setHistory] = useState<VisitSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const result = await getSessionHistory()
    if (result.success) {
      setHistory(result.data)
    } else {
      setError(result.error.message)
    }

    setIsLoading(false)
  }, [])

  async function handleStartSession() {
    setIsLoading(true)
    setError(null)
    const result = await startSession()
    setIsLoading(false)
    if (!result.success) {
      setError(result.error.message)
      return null
    }
    setActiveSession(result.data)
    return result.data
  }

  async function handleEndSession(sessionId: string) {
    setIsLoading(true)
    setError(null)
    const result = await endSession(sessionId)
    setIsLoading(false)
    if (!result.success) {
      setError(result.error.message)
      return false
    }
    setActiveSession(null)
    return true
  }

  return {
    activeSession,
    history,
    isLoading,
    error,
    fetchHistory,
    startSession: handleStartSession,
    endSession: handleEndSession,
  }
}
```

**Aturan hook:**
- Setiap hook punya state: `isLoading`, `error`, dan data utama
- `error` selalu bertipe `string | null` (bukan `Error`)
- Fungsi yang dipanggil user menggunakan prefix `handle` secara internal, tapi yang di-return diberi nama lebih bersih
- Gunakan `useCallback` untuk fungsi yang masuk ke dependency array `useEffect`

---

## 5. React Context — Hanya Untuk Auth & Toast

### Auth Context

```tsx
// src/stores/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getUserProfile } from '@/services/auth.service'
import { getToken, removeToken, saveToken } from '@/lib/token'
import type { UserProfile } from '@/types/user.types'

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: UserProfile) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function initialize() {
      const token = getToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      const result = await getUserProfile()
      if (result.success) {
        setUser(result.data)
      } else {
        removeToken()
      }
      setIsLoading(false)
    }

    initialize()
  }, [])

  function login(token: string, userData: UserProfile) {
    saveToken(token)
    setUser(userData)
  }

  function logout() {
    removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook untuk konsumsi context — SELALU via hook ini, bukan useContext langsung
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return ctx
}
```

### Toast Context

```tsx
// src/stores/ToastContext.tsx
'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toasts: Toast[]
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
  }

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      {/* ToastContainer dirender di sini */}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus digunakan di dalam ToastProvider')
  return ctx
}
```

---

## 6. Session Storage untuk Active Session

Data sesi kunjungan yang aktif disimpan di `sessionStorage` (hilang saat tab ditutup):

```ts
// src/lib/token.ts
const TOKEN_KEY = 'eis_token'
const SESSION_KEY = 'eis_active_session'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(SESSION_KEY)
}

export function saveActiveSessionId(sessionId: string): void {
  sessionStorage.setItem(SESSION_KEY, sessionId)
}

export function clearActiveSessionId(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
```

---

## 7. Larangan

- ❌ Jangan install Zustand, Jotai, Redux, Recoil, atau state manager lain
- ❌ Jangan simpan data response API di `localStorage` (kecuali token)
- ❌ Jangan buat Context untuk setiap fitur (quiz context, exhibit context, dll)
- ❌ Jangan gunakan `useEffect` hanya untuk sinkronisasi state ke state lain — gunakan derived state
