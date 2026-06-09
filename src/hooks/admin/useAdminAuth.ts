// src/hooks/admin/useAdminAuth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { requestOtp, verifyOtp, getUserProfile } from "@/services/auth.service";
import { saveToken, removeToken, getToken } from "@/lib/token";
import { ROUTES } from "@/constants/routes";
import type { UserProfile } from "@/types/user.types";

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper function to set cookies
  const setAuthCookies = (role: string) => {
    document.cookie = `eis_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    document.cookie = `eis_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  };

  // Helper function to clear cookies
  const clearAuthCookies = () => {
    document.cookie = "eis_auth=; path=/; max-age=0";
    document.cookie = "eis_role=; path=/; max-age=0";
  };

  // 1. Request OTP
  const login = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestOtp(email.trim().toLowerCase());
      setIsLoading(false);
      return result;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim OTP.";
      setError(errMsg);
      setIsLoading(false);
      return { success: false, error: { message: errMsg, statusCode: 500 } };
    }
  }, []);

  // 2. Verify OTP
  const verify = useCallback(async (email: string, otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyOtp({
        email: email.trim().toLowerCase(),
        otp,
      });

      if (result.success) {
        // Check if role is admin
        if (result.data.user.role.toLowerCase() !== "admin") {
          setIsLoading(false);
          const forbiddenError = "Akses ditolak: Anda bukan administrator.";
          setError(forbiddenError);
          return {
            success: false,
            error: { message: forbiddenError, statusCode: 403 }
          };
        }

        // Save token & cookies
        saveToken(result.data.token);
        setAuthCookies(result.data.user.role);
        setAdminUser(result.data.user);
      }
      setIsLoading(false);
      return result;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat verifikasi OTP.";
      setError(errMsg);
      setIsLoading(false);
      return { success: false, error: { message: errMsg, statusCode: 500 } };
    }
  }, []);

  // 3. Logout
  const logout = useCallback(() => {
    removeToken();
    clearAuthCookies();
    setAdminUser(null);
    router.replace(ROUTES.admin.login);
  }, [router]);

  // 4. Validate current auth token and load profile
  const checkAuth = useCallback(async () => {
    await Promise.resolve(); // force async execution to prevent synchronous state updates in useEffect
    const token = getToken();
    if (!token) {
      clearAuthCookies();
      setAdminUser(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const result = await getUserProfile();
      if (result.success) {
        if (result.data.role.toLowerCase() === "admin") {
          setAdminUser(result.data);
          setAuthCookies(result.data.role);
          setIsLoading(false);
          return result.data;
        } else {
          // If token belongs to non-admin, clean up and redirect
          logout();
        }
      } else {
        // Token is invalid/expired
        logout();
      }
    } catch {
      logout();
    }
    setIsLoading(false);
    return null;
  }, [logout]);

  // Check auth on mount
  useEffect(() => {
    Promise.resolve().then(() => {
      checkAuth();
    });
  }, [checkAuth]);

  return {
    adminUser,
    isLoading,
    error,
    login,
    verify,
    logout,
    checkAuth,
  };
}
