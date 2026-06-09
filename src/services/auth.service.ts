// src/services/auth.service.ts
import { apiRequest } from "./api";
import { API } from "@/constants/api-endpoints";
import type { RegisterPayload, VerifyOtpPayload, UserProfile } from "@/types/user.types";

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<{ userId: string }>(API.users.register, {
    method: "POST",
    body: payload,
    isPublic: true,
  });
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  return apiRequest<{ token: string; user: UserProfile }>(API.users.verifyOtp, {
    method: "POST",
    body: payload,
    isPublic: true,
  });
}

export async function requestOtp(email: string) {
  return apiRequest<{ message: string }>(API.users.requestOtp, {
    method: "POST",
    body: { email },
    isPublic: true,
  });
}

export async function getUserProfile() {
  return apiRequest<UserProfile>(API.users.profile);
}

