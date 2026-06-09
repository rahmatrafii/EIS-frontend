// src/constants/cloudinary.ts — Konfigurasi Cloudinary untuk frontend upload

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "eis-engine";

export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "eis_unsigned_upload";

export const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

/**
 * Mapping mediaType → folder path di Cloudinary.
 * Struktur: eis-engine/exhibits/{tipe}/
 */
export const MEDIA_FOLDER_MAP: Record<string, string> = {
  AUDIO: "eis-engine/exhibits/audio",
  VIDEO: "eis-engine/exhibits/video",
  IMAGE_INFOGRAPHIC: "eis-engine/exhibits/images",
  INTERACTIVE_LAB: "eis-engine/exhibits/interactive",
} as const;

/**
 * Batas ukuran file per mediaType (dalam bytes).
 * Gambar dibatasi 10MB, selainnya 50MB.
 */
export const MAX_FILE_SIZE: Record<string, number> = {
  AUDIO: 50 * 1024 * 1024, // 50MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  IMAGE_INFOGRAPHIC: 10 * 1024 * 1024, // 10MB
  INTERACTIVE_LAB: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * MIME types yang diizinkan per mediaType.
 */
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  AUDIO: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"],
  VIDEO: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  IMAGE_INFOGRAPHIC: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  INTERACTIVE_LAB: ["application/json"],
} as const;

/**
 * Accept string untuk <input type="file"> per mediaType.
 */
export const FILE_ACCEPT_MAP: Record<string, string> = {
  AUDIO: "audio/*",
  VIDEO: "video/*",
  IMAGE_INFOGRAPHIC: "image/*",
  INTERACTIVE_LAB: "application/json,.json",
} as const;
