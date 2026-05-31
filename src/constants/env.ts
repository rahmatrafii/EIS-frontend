// src/constants/env.ts — SELALU akses via sini, bukan langsung process.env
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.eisengine.com/api/v1";
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Zoo Companion";
