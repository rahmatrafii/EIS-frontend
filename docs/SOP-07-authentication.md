# SOP-07 — Authentication

> **Mekanisme**: JWT via `localStorage`. OTP 6 digit dikirim via email (Resend API dari backend). Tidak ada password.

---

## 1. Alur Lengkap Auth

```
[Register]
  POST /users/register  →  user dibuat, belum dapat token

[Request OTP]
  POST /users/request-otp (email)  →  email terkirim

[Verify OTP]
  POST /users/verify-otp (email + kode)  →  dapat { token, user }

[Simpan Token]
  localStorage.setItem('eis_token', token)
  AuthContext.login(token, user)

[Setiap Request]
  Authorization: Bearer <token>

[Logout]
  localStorage.removeItem('eis_token')
  AuthContext.logout()
  redirect('/login')
```

---

## 2. Penyimpanan Token

```ts
// src/lib/token.ts — SATU-SATUNYA tempat akses token

const TOKEN_KEY = 'eis_token'

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
```

**Aturan:**
- Token **hanya** disimpan di `localStorage`
- Jangan simpan token di cookie, sessionStorage, atau variabel global
- Selalu cek `typeof window === 'undefined'` sebelum akses localStorage (SSR safe)

---

## 3. Middleware — Route Protection

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { ROUTES } from '@/constants/routes'

// Route yang tidak butuh auth
const PUBLIC_ROUTES = [
  ROUTES.login,
  ROUTES.register,
  '/retention',  // prefix untuk /retention/[token]
]

// Route khusus admin
const ADMIN_ROUTES = ['/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cek apakah route ini public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  )

  // Token disimpan di localStorage, tidak bisa dibaca di middleware (server-side)
  // Gunakan cookie sebagai sinyal auth untuk middleware
  const authCookie = request.cookies.get('eis_auth')?.value

  if (!isPublicRoute && !authCookie) {
    const loginUrl = new URL(ROUTES.login, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Cek akses admin
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  const userRole = request.cookies.get('eis_role')?.value

  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)'],
}
```

**Catatan middleware + localStorage:**
Karena middleware berjalan di server, ia tidak bisa membaca `localStorage`. Solusinya: saat login berhasil, set cookie sinyal auth (bukan token itu sendiri):

```ts
// Di login handler (client component)
function login(token: string, user: UserProfile) {
  saveToken(token)  // token lengkap di localStorage
  
  // Cookie sinyal untuk middleware (tidak menyimpan token sensitif)
  document.cookie = `eis_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
  document.cookie = `eis_role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function logout() {
  removeToken()
  document.cookie = 'eis_auth=; path=/; max-age=0'
  document.cookie = 'eis_role=; path=/; max-age=0'
}
```

---

## 4. Role Guard di Komponen

```tsx
// src/components/auth/RoleGuard.tsx
'use client'

import { useAuth } from '@/stores/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ROUTES } from '@/constants/routes'
import type { UserRole } from '@/types/user.types'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.replace(ROUTES.dashboard)
    }
  }, [user, isLoading, allowedRoles, router])

  if (isLoading) return null
  if (!user || !allowedRoles.includes(user.role)) return fallback ?? null

  return <>{children}</>
}
```

---

## 5. Alur OTP Flow di UI

```
Halaman /register
  → Isi form (nama, email, usia, dll)
  → Submit → POST /users/register
  → Redirect ke /login dengan email pre-filled

Halaman /login
  → Isi email
  → Klik "Kirim OTP" → POST /users/request-otp
  → Tampilkan input 6 digit OTP + countdown timer (60 detik)
  → Isi kode OTP
  → Submit → POST /users/verify-otp
  → Jika sukses: simpan token → redirect ke /dashboard
  → Jika gagal: tampilkan error, bisa request ulang setelah countdown
```

**State untuk OTP Form:**
```ts
type OtpStep = 'email' | 'otp'  // dua langkah dalam satu halaman

const [step, setStep] = useState<OtpStep>('email')
const [email, setEmail] = useState('')
const [otp, setOtp] = useState('')
const [countdown, setCountdown] = useState(0)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

---

## 6. Handling 401 Unauthorized

Jika API mengembalikan 401, artinya token expired. Handle di `api.ts`:

```ts
// Tambahan di apiRequest()
if (response.status === 401) {
  // Clear auth state
  removeToken()
  if (typeof window !== 'undefined') {
    document.cookie = 'eis_auth=; path=/; max-age=0'
    document.cookie = 'eis_role=; path=/; max-age=0'
    window.location.href = ROUTES.login  // Hard redirect
  }
  return {
    success: false,
    error: { message: 'Sesi Anda telah berakhir. Silakan login kembali.', statusCode: 401 },
  }
}
```
