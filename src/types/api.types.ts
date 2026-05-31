// src/types/api.types.ts

// Generic response shape dari backend
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

// Shape error dari backend
export type ApiErrorShape = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

// Result dari wrapper fetch kita (bukan dari backend langsung)
export type ApiResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        message: string;
        statusCode: number;
        code?: string;
        errors?: Record<string, string[]>;
      };
    };
