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

/**
 * Memvalidasi form tambah kandang baru.
 */
export function validateExhibitForm(form: {
  name: string;
  zone: string;
  customZone?: string;
}): ValidationResult {
  const errors: ValidationResult = {};

  if (!form.name.trim()) {
    errors.name = "Nama kandang wajib diisi";
  } else if (form.name.trim().length < 2) {
    errors.name = "Nama kandang minimal 2 karakter";
  } else if (form.name.trim().length > 100) {
    errors.name = "Nama kandang maksimal 100 karakter";
  }

  if (!form.zone) {
    errors.zone = "Nama zona wajib dipilih";
  } else if (form.zone === "Lainnya" && (!form.customZone || !form.customZone.trim())) {
    errors.customZone = "Nama zona kustom wajib diisi";
  } else if (form.zone === "Lainnya" && form.customZone && form.customZone.trim().length < 2) {
    errors.customZone = "Nama zona kustom minimal 2 karakter";
  } else if (form.zone === "Lainnya" && form.customZone && form.customZone.trim().length > 50) {
    errors.customZone = "Nama zona kustom maksimal 50 karakter";
  }

  return errors;
}

/**
 * Memvalidasi form pembuat/pengedit kuis (A-10).
 */
export function validateQuizForm(form: {
  title: string;
  quizType: string;
  ageCategory: string;
  scope: string;
  exhibitId: string | number | null;
  questions: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    points: number;
  }[];
}): ValidationResult {
  const errors: ValidationResult = {};

  if (!form.title.trim()) {
    errors.title = "Judul kuis wajib diisi";
  }

  if (!form.quizType) {
    errors.quizType = "Tipe kuis wajib dipilih";
  }

  if (!form.ageCategory) {
    errors.ageCategory = "Kategori usia wajib dipilih";
  }

  if (!form.scope) {
    errors.scope = "Cakupan kuis wajib dipilih";
  } else if (form.scope === "EXHIBIT" && !form.exhibitId) {
    errors.exhibitId = "Kandang wajib dipilih untuk cakupan Spesifik Kandang";
  }

  if (!form.questions || form.questions.length === 0) {
    errors.questions = "Kuis harus memiliki minimal 1 soal";
  } else if (form.questions.length > 50) {
    errors.questions = "Kuis maksimal hanya boleh memiliki 50 soal";
  } else {
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.questionText.trim()) {
        errors[`question_${i}_text`] = `Pertanyaan soal ${i + 1} tidak boleh kosong`;
      }
      if (!q.optionA.trim()) {
        errors[`question_${i}_optionA`] = `Pilihan A soal ${i + 1} tidak boleh kosong`;
      }
      if (!q.optionB.trim()) {
        errors[`question_${i}_optionB`] = `Pilihan B soal ${i + 1} tidak boleh kosong`;
      }
      if (!q.optionC.trim()) {
        errors[`question_${i}_optionC`] = `Pilihan C soal ${i + 1} tidak boleh kosong`;
      }
      if (!q.optionD.trim()) {
        errors[`question_${i}_optionD`] = `Pilihan D soal ${i + 1} tidak boleh kosong`;
      }
      if (!q.correctOption) {
        errors[`question_${i}_correctOption`] = `Jawaban benar soal ${i + 1} belum dipilih`;
      }
    }
  }

  return errors;
}

/**
 * Memvalidasi kode OTP 6 digit.
 */
export function validateOtpCode(code: string): string | null {
  if (!code.trim()) return "Kode OTP tidak boleh kosong";
  if (!/^\d{6}$/.test(code)) return "Kode OTP harus 6 digit angka";
  return null;
}
