// src/services/api.ts
import { API_BASE_URL } from "@/constants/env";
import { getToken } from "@/lib/token";
import type { ApiResult } from "@/types/api.types";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  isPublic?: boolean; // jika true, tidak kirim Authorization header
};

interface ApiResponsePayload {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
  data?: unknown;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const { method = "GET", body, isPublic = false } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (!isPublic) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Cek jika response kosong
    const contentType = response.headers.get("content-type");
    let json: ApiResponsePayload = {};
    if (contentType && contentType.includes("application/json")) {
      json = await response.json() as ApiResponsePayload;
    }

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: json.message ?? "Terjadi kesalahan pada server",
          statusCode: response.status,
          code: json.code,
          errors: json.errors,
        },
      };
    }

    return { success: true, data: (json.data ?? json) as T };
  } catch {
    return {
      success: false,
      error: {
        message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
        statusCode: 0,
      },
    };
  }
}
