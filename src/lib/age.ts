// src/lib/age.ts

/**
 * Menghitung usia (dalam tahun) dari string tanggal lahir (format YYYY-MM-DD).
 */
export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Mengembalikan label kategori umur beserta emoji pendukung berdasarkan usia (dalam tahun).
 */
export function getAgeCategoryLabel(age: number): string {
  if (age >= 5 && age <= 11) return "🧒 Anak-anak (5-11 tahun)";
  if (age >= 12 && age <= 17) return "🧑 Remaja (12-17 tahun)";
  if (age >= 18) return "👤 Dewasa (18+ tahun)";
  return "👶 Balita (<5 tahun)";
}
