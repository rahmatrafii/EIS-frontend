# SOP-08 — Form Handling

> **Stack**: Form native React (controlled) + validasi client-side manual. Tidak ada React Hook Form, Formik, atau library form lain.

---

## 1. Pola Form Standar

Setiap form mengikuti struktur ini:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/stores/ToastContext'
import { registerUser } from '@/services/auth.service'
import { validateRegisterForm } from '@/lib/validators'
import type { RegisterPayload } from '@/types/user.types'

// 1. Tipe form state
interface RegisterFormState {
  name: string
  email: string
  age: string
}

// 2. Tipe errors
type FormErrors = Partial<Record<keyof RegisterFormState, string>>

export function RegisterForm() {
  // 3. State form
  const [form, setForm] = useState<RegisterFormState>({
    name: '',
    email: '',
    age: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  // 4. Handler perubahan field — SATU handler untuk semua field
  function handleChange(field: keyof RegisterFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      // Clear error field saat user mulai mengetik
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }
  }

  // 5. Handler submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validasi
    const validationErrors = validateRegisterForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    const payload: RegisterPayload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      age: Number(form.age),
    }

    const result = await registerUser(payload)

    setIsSubmitting(false)

    if (!result.success) {
      // Error dari server (mis. email sudah terdaftar)
      if (result.error.errors) {
        setErrors(result.error.errors as FormErrors)
      } else {
        toast.error(result.error.message)
      }
      return
    }

    toast.success('Registrasi berhasil! Silakan login.')
    // redirect atau next step
  }

  // 6. JSX — TIDAK ada <form> method atau action (dikontrol JS)
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Nama Lengkap"
        value={form.name}
        onChange={handleChange('name')}
        error={errors.name}
        placeholder="Masukkan nama lengkap"
        required
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={handleChange('email')}
        error={errors.email}
        placeholder="contoh@email.com"
        required
      />
      <Input
        label="Usia"
        type="number"
        value={form.age}
        onChange={handleChange('age')}
        error={errors.age}
        placeholder="Contoh: 25"
        min="1"
        max="120"
        required
      />
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Daftar
      </Button>
    </form>
  )
}
```

---

## 2. Komponen Input Standar

```tsx
// src/components/ui/Input.tsx
import { cn } from '@/lib/cn'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5',
          'text-sm text-gray-900 placeholder:text-gray-400',
          'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  )
}
```

---

## 3. Validasi Client-Side

Semua fungsi validasi disimpan di `src/lib/validators.ts` — **fungsi murni, tidak ada side effect**.

```ts
// src/lib/validators.ts
import type { RegisterPayload } from '@/types/user.types'

type ValidationResult = Record<string, string>

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateRegisterForm(
  form: Pick<RegisterPayload, 'name' | 'email'> & { age: string }
): ValidationResult {
  const errors: ValidationResult = {}

  if (!form.name.trim()) {
    errors.name = 'Nama tidak boleh kosong'
  } else if (form.name.trim().length < 2) {
    errors.name = 'Nama minimal 2 karakter'
  }

  if (!form.email.trim()) {
    errors.email = 'Email tidak boleh kosong'
  } else if (!validateEmail(form.email)) {
    errors.email = 'Format email tidak valid'
  }

  const age = Number(form.age)
  if (!form.age) {
    errors.age = 'Usia tidak boleh kosong'
  } else if (isNaN(age) || age < 1 || age > 120) {
    errors.age = 'Usia harus berupa angka antara 1–120'
  }

  return errors
}

export function validateOtpCode(code: string): string | null {
  if (!code.trim()) return 'Kode OTP tidak boleh kosong'
  if (!/^\d{6}$/.test(code)) return 'Kode OTP harus 6 digit angka'
  return null
}
```

---

## 4. OTP Input — Pola 6 Digit

```tsx
'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(index: number, digit: string) {
    if (!/^\d?$/.test(digit)) return  // hanya angka
    const chars = value.split('')
    chars[index] = digit
    onChange(chars.join('').slice(0, 6))
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'h-12 w-10 rounded-xl border text-center text-lg font-bold',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
              'transition-colors duration-150',
              error ? 'border-red-500' : 'border-gray-200'
            )}
          />
        ))}
      </div>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

---

## 5. Textarea Standar

```tsx
// src/components/ui/Textarea.tsx
import { cn } from '@/lib/cn'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <textarea
        className={cn(
          'w-full rounded-xl border border-gray-200 bg-white px-4 py-3',
          'text-sm text-gray-900 placeholder:text-gray-400 resize-none',
          'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
          'transition-colors duration-150',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

---

## 6. Aturan Form

- ❌ Jangan gunakan `action` atau `method` pada `<form>` — semua via `onSubmit`
- ✅ Selalu `e.preventDefault()` di `handleSubmit`
- ✅ Selalu ada `noValidate` pada `<form>` untuk disable browser validation
- ✅ Validasi client dilakukan SEBELUM memanggil API
- ✅ Error server (dari `result.error.errors`) di-map ke field errors, bukan ditampilkan sebagai toast
- ✅ Error umum server (bukan field) ditampilkan via `toast.error()`
- ✅ Button submit selalu `isLoading={isSubmitting}` dan tidak bisa diklik ulang
