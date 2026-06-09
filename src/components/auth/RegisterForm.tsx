// src/components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/stores/ToastContext";
import { registerUser, requestOtp } from "@/services/auth.service";
import { validateRegisterForm } from "@/lib/validators";
import { calculateAge, getAgeCategoryLabel } from "@/lib/age";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/lib/animations";
import type { RegisterPayload } from "@/types/user.types";

interface RegisterFormState {
  name: string;
  email: string;
  dob: string;
}

type FormErrors = Partial<Record<keyof RegisterFormState, string>>;

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    dob: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state untuk kategori usia
  const age = form.dob ? calculateAge(form.dob) : null;
  const ageCategoryLabel = age !== null ? getAgeCategoryLabel(age) : "";

  // Single handler untuk semua field perubahan input
  function handleChange(field: keyof RegisterFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
      
      // Clear error field saat user mulai mengetik
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validasi input form client-side
    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    const payload: RegisterPayload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      age: age !== null ? age : 0,
    };

    try {
      const result = await registerUser(payload);

      if (!result.success) {
        const errorMsg = result.error.message;
        const errorCode = result.error.code;

        // 1. Tangani Duplikasi Email (EMAIL_ALREADY_EXISTS)
        if (errorCode === "EMAIL_ALREADY_EXISTS" || errorMsg.includes("Email ini telah terdaftar")) {
          setErrors({ email: "Email ini telah terdaftar di sistem" });
        }
        // 2. Tangani Validation Error dari backend (VALIDATION_ERROR atau status 400)
        else if (errorCode === "VALIDATION_ERROR" || result.error.statusCode === 400) {
          const mappedErrors: FormErrors = {};
          
          // Uraikan pesan error validasi (format backend: "email: Format email tidak valid, age: Usia minimal 5 tahun")
          const parts = errorMsg.split(",");
          parts.forEach((part) => {
            const trimmed = part.trim();
            if (trimmed.startsWith("email:")) {
              mappedErrors.email = trimmed.replace("email:", "").trim();
            } else if (trimmed.startsWith("name:")) {
              mappedErrors.name = trimmed.replace("name:", "").trim();
            } else if (trimmed.startsWith("age:")) {
              mappedErrors.dob = trimmed.replace("age:", "").trim();
            }
          });

          if (Object.keys(mappedErrors).length > 0) {
            setErrors(mappedErrors);
          } else {
            toast.error(errorMsg);
          }
        }
        // 3. Tangani Error Lainnya (Umum)
        else {
          toast.error(errorMsg);
        }
        setIsSubmitting(false);
        return;
      }

      // Simpan e-mail ke sessionStorage sesuai spesifikasi SOP-13 (V-02)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("email", form.email.trim());
      }

      // Kirim OTP ke email user yang baru terdaftar (Opsi A — frontend-driven)
      const otpResult = await requestOtp(form.email.trim().toLowerCase());
      if (!otpResult.success) {
        // Registrasi sudah berhasil, tapi OTP gagal dikirim.
        // User tetap dialihkan ke halaman OTP dan bisa menekan "Kirim ulang".
        toast.warning("Registrasi berhasil, tapi gagal mengirim OTP. Silakan kirim ulang di halaman berikutnya.");
      } else {
        toast.success("Registrasi berhasil! Kode OTP telah dikirim ke emailmu.");
      }

      // Redirect ke halaman verifikasi OTP
      router.push(ROUTES.verifyOtp);
    } catch {
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  }

  // Tanggal maksimum adalah hari ini
  const maxDateString = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-md h-full">
      {/* Input Nama Lengkap */}
      <Input
        label="Nama Lengkap"
        placeholder="Masukkan nama lengkapmu"
        value={form.name}
        onChange={handleChange("name")}
        error={errors.name}
        required
        disabled={isSubmitting}
      />

      {/* Input Email */}
      <Input
        label="Email"
        type="email"
        placeholder="contoh@email.com"
        value={form.email}
        onChange={handleChange("email")}
        error={errors.email}
        hint="Kode OTP akan dikirim ke email ini"
        required
        disabled={isSubmitting}
      />

      {/* Input Tanggal Lahir */}
      <div className="flex flex-col w-full">
        <Input
          label="Tanggal Lahir"
          type="date"
          max={maxDateString}
          value={form.dob}
          onChange={handleChange("dob")}
          error={errors.dob}
          required
          disabled={isSubmitting}
        />

        {/* Dynamic Age Chip (Framer Motion) */}
        {form.dob && !errors.dob && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-2"
          >
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold shadow-xs">
              {ageCategoryLabel}
            </span>
          </motion.div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-[24px]" />

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        isLoading={isSubmitting}
        className="w-full py-3.5 bg-primary text-on-primary rounded-full font-plus-jakarta-sans text-[18px] font-semibold flex items-center justify-center gap-2 hover:bg-primary/95 transition-colors active:scale-[0.98] duration-100 mt-auto shadow-md"
      >
        Kirim Kode OTP →
      </Button>
    </form>
  );
}
