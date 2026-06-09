// src/services/cloudinary.service.ts — Upload file ke Cloudinary dari browser

import {
  CLOUDINARY_UPLOAD_URL,
  CLOUDINARY_UPLOAD_PRESET,
  MEDIA_FOLDER_MAP,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from "@/constants/cloudinary";

/**
 * Hasil validasi file sebelum upload.
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Callback untuk progress upload (0–100).
 */
type ProgressCallback = (percent: number) => void;

/**
 * Validasi file sebelum upload ke Cloudinary.
 * Mengecek MIME type dan ukuran file berdasarkan mediaType.
 *
 * @param file - File yang dipilih user dari input
 * @param mediaType - Tipe media: AUDIO | VIDEO | IMAGE_INFOGRAPHIC | INTERACTIVE_LAB
 * @returns Hasil validasi: { valid, error? }
 */
export function validateMediaFile(
  file: File,
  mediaType: string
): ValidationResult {
  // 1. Cek apakah mediaType dikenali
  const allowedMimes = ALLOWED_MIME_TYPES[mediaType];
  if (!allowedMimes) {
    return { valid: false, error: `Tipe media "${mediaType}" tidak dikenali.` };
  }

  // 2. Cek MIME type file
  const isValidType = allowedMimes.some((mime) => {
    if (mime.endsWith("/*")) {
      // Wildcard match, contoh: "audio/*"
      return file.type.startsWith(mime.replace("/*", "/"));
    }
    return file.type === mime;
  });

  if (!isValidType) {
    const friendlyTypes: Record<string, string> = {
      AUDIO: "audio (MP3, WAV, OGG)",
      VIDEO: "video (MP4, WebM)",
      IMAGE_INFOGRAPHIC: "gambar (JPG, PNG, WebP)",
      INTERACTIVE_LAB: "JSON",
    };
    return {
      valid: false,
      error: `File harus berupa ${friendlyTypes[mediaType] ?? mediaType}. Tipe file yang diterima: ${file.type || "tidak dikenali"}.`,
    };
  }

  // 3. Cek ukuran file
  const maxSize = MAX_FILE_SIZE[mediaType] ?? 50 * 1024 * 1024;
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ukuran file (${fileMB} MB) melebihi batas maksimal ${maxMB} MB.`,
    };
  }

  return { valid: true };
}

/**
 * Upload file ke Cloudinary menggunakan unsigned upload preset.
 * Menggunakan XMLHttpRequest agar bisa menangkap progress upload.
 *
 * @param file - File yang akan diupload
 * @param mediaType - Tipe media (menentukan folder tujuan di Cloudinary)
 * @param onProgress - Callback opsional untuk update progress (0–100)
 * @returns Promise<string> — URL secure_url dari Cloudinary
 * @throws Error jika upload gagal
 */
export function uploadToCloudinary(
  file: File,
  mediaType: string,
  onProgress?: ProgressCallback
): Promise<string> {
  return new Promise((resolve, reject) => {
    const folder = MEDIA_FOLDER_MAP[mediaType];
    if (!folder) {
      reject(new Error(`Tipe media "${mediaType}" tidak memiliki folder mapping.`));
      return;
    }

    // Siapkan FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    // Gunakan XMLHttpRequest untuk progress tracking
    const xhr = new XMLHttpRequest();
    xhr.open("POST", CLOUDINARY_UPLOAD_URL);

    // Progress handler
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    // Success handler
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve(response.secure_url as string);
          } else {
            reject(new Error("Response dari Cloudinary tidak mengandung secure_url."));
          }
        } catch {
          reject(new Error("Gagal memproses response dari Cloudinary."));
        }
      } else {
        // Coba parse error message dari Cloudinary
        let errorMessage = `Upload gagal (HTTP ${xhr.status})`;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          if (errorResponse.error?.message) {
            errorMessage = errorResponse.error.message;
          }
        } catch {
          // Gunakan default error message
        }
        reject(new Error(errorMessage));
      }
    });

    // Network error handler
    xhr.addEventListener("error", () => {
      reject(new Error("Gagal terhubung ke Cloudinary. Periksa koneksi internet Anda."));
    });

    // Abort handler
    xhr.addEventListener("abort", () => {
      reject(new Error("Upload dibatalkan."));
    });

    xhr.send(formData);
  });
}

/**
 * Format ukuran file ke string yang mudah dibaca.
 * Contoh: 1536000 → "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
