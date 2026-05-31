// src/lib/validators.ts

import { calculateAge } from "./age";

type ValidationResult = Record<string, string>;

/**
 * Memvalidasi apakah format string email sesuai regex standar.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Memvalidasi form registrasi di sisi client.
 */
export function validateRegisterForm(form: {
  name: string;
  email: string;
  dob: string;
}): ValidationResult {
  const errors: ValidationResult = {};

  // Validasi Nama Lengkap
  if (!form.name.trim()) {
    errors.name = "Nama harus diisi";
  } else if (form.name.trim().length < 2) {
    errors.name = "Nama minimal 2 karakter";
  }

  // Validasi Email
  if (!form.email.trim()) {
    errors.email = "Email harus diisi";
  } else if (!validateEmail(form.email)) {
    errors.email = "Format email tidak valid";
  }

  // Validasi Tanggal Lahir
  if (!form.dob) {
    errors.dob = "Tanggal lahir harus diisi";
  } else {
    const birthDate = new Date(form.dob);
    const today = new Date();
    
    if (birthDate > today) {
      errors.dob = "Tanggal lahir tidak boleh di masa depan";
    } else {
      const age = calculateAge(form.dob);
      if (age < 5) {
        errors.dob = "Usia minimal adalah 5 tahun";
      } else if (age > 120) {
        errors.dob = "Usia maksimal adalah 120 tahun";
      }
    }
  }

  return errors;
}
