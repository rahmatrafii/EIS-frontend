// src/types/user.types.ts
export type UserRole = "visitor" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  role: UserRole;
  created_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  age: number;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}
