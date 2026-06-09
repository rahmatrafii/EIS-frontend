// src/hooks/useSession.ts
"use client";

import { useState, useCallback } from "react";
import { startSession as startSessionApi } from "@/services/session.service";
import { getSessionHistory } from "@/services/session.service";
import { getActiveSessionId, saveActiveSessionId } from "@/lib/token";

export function useSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeSession = useCallback(async (): Promise<number | null> => {
    // 1. Cek jika sudah ada session_id aktif di sessionStorage
    const existingSessionId = getActiveSessionId();
    if (existingSessionId) {
      return parseInt(existingSessionId, 10);
    }

    // 2. Jika belum ada di sessionStorage, coba recovery dari database
    //    Ini menangani kasus: tab baru, refresh, atau sessionStorage terhapus
    setIsLoading(true);
    setError(null);

    try {
      const historyResult = await getSessionHistory();

      if (historyResult.success) {
        // Cari sesi aktif yang belum selesai (isCompleted: false)
        const activeSession = historyResult.data.find(
          (s) => !s.isCompleted
        );

        if (activeSession) {
          // Recovery berhasil — simpan ke sessionStorage dan gunakan
          saveActiveSessionId(activeSession.id.toString());
          setIsLoading(false);
          return activeSession.id;
        }
      }
    } catch {
      // Jika history endpoint gagal, fallback ke behavior lama (coba startSession)
      console.warn("Session history check failed, attempting to create new session");
    }

    // 3. Tidak ada sesi aktif di database — buat sesi baru
    let result = await startSessionApi();

    // Jika terjadi SESSION_ALREADY_ACTIVE (misal akibat race condition / double-mount di React 18 dev mode),
    // lakukan fallback recovery dari riwayat sesi di database.
    if (!result.success && result.error?.code === "SESSION_ALREADY_ACTIVE") {
      try {
        const historyResult = await getSessionHistory();
        if (historyResult.success) {
          const activeSession = historyResult.data.find(
            (s) => !s.isCompleted
          );
          if (activeSession) {
            saveActiveSessionId(activeSession.id.toString());
            setIsLoading(false);
            return activeSession.id;
          }
        }
      } catch (err) {
        console.warn("Fallback session recovery failed:", err);
      }
    }

    setIsLoading(false);

    if (result.success) {
      const newSessionId = result.data.id;
      saveActiveSessionId(newSessionId.toString());
      return newSessionId;
    } else {
      setError(result.error?.message || "Gagal memproses sesi kunjungan");
      return null;
    }
  }, []);

  return {
    initializeSession,
    isLoading,
    error,
  };
}
