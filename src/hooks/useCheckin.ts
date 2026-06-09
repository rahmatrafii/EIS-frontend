// src/hooks/useCheckin.ts
"use client";

import { useState } from "react";
import { checkinExhibit } from "@/services/track.service";
import { getActiveSessionId } from "@/lib/token";
import type { CheckinResult } from "@/types/tracking.types";

export function useCheckin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkin(qrCodeIdentifier: string): Promise<CheckinResult | null> {
    setIsLoading(true);
    setError(null);

    const sessionIdStr = getActiveSessionId();
    if (!sessionIdStr) {
      setError("Sesi kunjungan tidak aktif. Silakan mulai sesi terlebih dahulu.");
      setIsLoading(false);
      return null;
    }

    const sessionId = parseInt(sessionIdStr, 10);
    if (isNaN(sessionId)) {
      setError("Format sesi kunjungan tidak valid.");
      setIsLoading(false);
      return null;
    }

    const result = await checkinExhibit({ qrCodeIdentifier, sessionId });
    setIsLoading(false);

    if (result.success) {
      return result.data;
    } else {
      setError(result.error.message);
      return null;
    }
  }

  return {
    checkin,
    isLoading,
    error,
    setError,
  };
}
