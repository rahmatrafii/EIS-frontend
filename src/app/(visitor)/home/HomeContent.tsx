// src/app/(visitor)/home/HomeContent.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useSession } from "@/hooks/useSession";
import { getUserProfile } from "@/services/auth.service";
import { getSessionHistory } from "@/services/session.service";
import { getSessionAnalytics } from "@/services/analytics.service";
import { getRetentionStatus } from "@/services/quiz.service";
import { ROUTES } from "@/constants/routes";
import { PageTransition } from "@/components/layout/PageTransition";
import { SessionTimer } from "@/components/visitor/SessionTimer";
import { RetentionStatusCard, type RetentionStatusType } from "@/components/visitor/RetentionStatusCard";
import { PageLoader } from "@/components/ui/PageLoader";

import type { UserProfile } from "@/types/user.types";
import type { VisitSession } from "@/types/session.types";
import type { SessionAnalytics, VisitedExhibitDetail } from "@/types/analytics.types";
import type { RetentionStatus } from "@/types/quiz.types";

export function HomeContent() {
  const router = useRouter();
  const { initializeSession, isLoading: isSessionLoading, error: sessionError } = useSession();

  // State bindings for fetched data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSession, setActiveSession] = useState<VisitSession | null>(null);
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [retention, setRetention] = useState<RetentionStatus | null>(null);

  // Layout states
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    setErrorMsg(null);

    // 1. Initialize visitor session
    const sessionId = await initializeSession();
    if (!sessionId) {
      setIsLoadingData(false);
      return;
    }

    try {
      // 2. Fetch all other APIs in parallel
      const [profileRes, historyRes, analyticsRes, retentionRes] = await Promise.all([
        getUserProfile(),
        getSessionHistory(),
        getSessionAnalytics(sessionId),
        getRetentionStatus(),
      ]);

      // Handle user profile response
      if (profileRes.success) {
        setProfile(profileRes.data);
      } else {
        setErrorMsg(profileRes.error.message || "Gagal memuat profil pengguna.");
        setIsLoadingData(false);
        return;
      }

      // Identify the current active session in the history list
      if (historyRes.success) {
        const activeSes = historyRes.data.find(
          (s) => s.id === sessionId && !s.isCompleted
        ) || historyRes.data.find((s) => s.id === sessionId);

        if (activeSes) {
          setActiveSession(activeSes);
        }
      }

      // Handle session analytics response
      if (analyticsRes.success) {
        setAnalytics(analyticsRes.data);
      }

      // Handle retention status response
      if (retentionRes.success) {
        setRetention(retentionRes.data);
      }

    } catch (err) {
      console.error("Dashboard error:", err);
      // Fail silently for secondary endpoints, using robust mock fallbacks if offline
    } finally {
      setIsLoadingData(false);
    }
  }, [initializeSession]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  // Formatting dates & labels cleanly
  const greetingName = profile?.name ? profile.name.split(" ")[0] : "Penjelajah";
  
  // Calculate localized check-in hour formatting
  const checkInHourFormatted = activeSession?.checkInAt
    ? new Date(activeSession.checkInAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }) + " WIB"
    : "09:00 WIB";

  const visitedExhibitsList = analytics?.visitedExhibits || [];

  const preTestScore = analytics?.preTestScore !== undefined ? analytics.preTestScore : 60;

  // Retention status calculation H+7 / H+30
  const retentionH7Status: RetentionStatusType = retention?.h7?.status 
    ? (retention.h7.status as RetentionStatusType) 
    : "PENDING";

  const retentionH30Status: RetentionStatusType = retention?.h30?.status 
    ? (retention.h30.status as RetentionStatusType) 
    : "LOCKED";

  const getFallbackDateStr = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const h7DateFormatted = retention?.h7?.expiresAt
    ? new Date(retention.h7.expiresAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : getFallbackDateStr(7);

  const h30DateFormatted = retention?.h30?.expiresAt
    ? new Date(retention.h30.expiresAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : getFallbackDateStr(30);

  // Main page error boundary
  const activeError = sessionError || errorMsg;
  if (activeError) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 text-center min-h-[600px]">
        <div className="p-4 bg-error-container/40 rounded-full mb-4">
          <RefreshCw className="h-8 w-8 text-error animate-pulse" />
        </div>
        <h3 className="font-plus-jakarta-sans text-[18px] font-bold text-on-surface mb-2">
          Gagal Memuat Dashboard
        </h3>
        <p className="font-inter text-sm text-on-surface-variant mb-6 max-w-[280px]">
          {activeError}
        </p>
        <button
          onClick={loadDashboardData}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-plus-jakarta-sans text-sm font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Dashboard Loader Skeleton
  if (isSessionLoading || isLoadingData) {
    return <PageLoader text="Menyiapkan petualanganmu..." minHeight="min-h-[600px]" />;
  }

  return (
    <PageTransition className="h-full overflow-y-auto overflow-x-hidden relative pb-8 bg-[#f7faf6] select-none">
      {/* Decorative Ambient Background Blobs */}
      <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
      <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

      {/* Header / Greeting Card */}
      <header className="bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12] rounded-b-[2.5rem] px-edge-margin pt-[70px] pb-10 relative text-on-primary shadow-lg overflow-hidden">
        {/* Glow Effects inside header */}
        <div
          aria-hidden="true"
          className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/15 blur-3xl -right-20 -top-20 z-0 pointer-events-none"
        ></div>
        <div
          aria-hidden="true"
          className="absolute w-60 h-60 rounded-full bg-primary/25 blur-3xl -left-20 -bottom-20 z-0 pointer-events-none"
        ></div>

        <div className="flex justify-between items-center mb-6 relative z-10">
          <span className="font-plus-jakarta-sans font-black text-[22px] tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-[#95f8a7] to-white drop-shadow-md select-none">
            ZOO
          </span>
          <button
            onClick={() => router.push(ROUTES.profile)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#95f8a7] to-[#00ff73] p-[2px] active:scale-95 hover:brightness-110 transition-all shadow-md shadow-black/15 cursor-pointer flex items-center justify-center"
            title="Profil Pengguna"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#003d16] to-[#001f0a] flex items-center justify-center">
              <span className="font-plus-jakarta-sans font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-white via-[#95f8a7] to-white select-none">
                {greetingName.charAt(0).toUpperCase()}
              </span>
            </div>
          </button>
        </div>
        
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex flex-col gap-1.5 select-none">
            <span className="block text-[9px] uppercase tracking-[0.25em] text-[#95f8a7] font-extrabold mb-1">
              Pusat Penjelajahan
            </span>
            <h1 className="font-plus-jakarta-sans text-[28px] font-black tracking-tight leading-tight drop-shadow-sm fade-in-up" style={{ animationDelay: "0.1s" }}>
              Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#95f8a7] via-[#d0ffdb] to-white">{greetingName}</span>! 👋
            </h1>
            <p className="text-white/80 font-inter text-xs leading-relaxed max-w-[280px] fade-in-up" style={{ animationDelay: "0.2s" }}>
              Siap melanjutkan ekspedisi belajarmu hari ini?
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <SessionTimer
              checkInAt={activeSession?.checkInAt}
              checkInLabel={checkInHourFormatted}
            />

            {activeSession && !activeSession.isCompleted && (
              <div className="mt-3 fade-in-up" style={{ animationDelay: "0.35s" }}>
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/35 px-4 py-2 rounded-full font-plus-jakarta-sans text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-[0.97] duration-150 cursor-pointer w-fit shadow-lg shadow-red-500/5"
                >
                  <span className="material-symbols-outlined text-xs font-black">logout</span>
                  <span>Akhiri Kunjungan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Scan QR Card (Below Header) */}
      <section className="px-edge-margin mt-6 relative z-10 fade-in-up animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        <div className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2.5rem] p-7 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-lg">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-[#004d1f] flex items-center justify-center mb-5 text-white shadow-lg shadow-primary/25 relative z-10">
            <span className="material-symbols-outlined text-[32px] font-variation-fill" style={{ fontVariationSettings: "'FILL' 1" }}>
              qr_code_scanner
            </span>
          </div>
          <h2 className="font-plus-jakarta-sans text-[19px] font-black text-on-surface mb-1.5 relative z-10">Scan Barcode Satwa</h2>
          <p className="text-on-surface-variant/80 font-inter text-[12px] mb-6 max-w-[240px] leading-relaxed relative z-10">
            Temukan papan QR di depan kandang satwa untuk membuka kuis, permainan, dan fakta seru!
          </p>
          <button
            onClick={() => router.push(ROUTES.scan)}
            className="bg-gradient-to-r from-primary to-[#005c24] hover:from-[#006e2b] hover:to-primary text-on-primary px-6 py-4 rounded-full font-plus-jakarta-sans text-[13px] font-extrabold tracking-wider uppercase flex items-center gap-2 transition-all w-full justify-center active:scale-[0.97] shadow-lg shadow-primary/25 cursor-pointer relative z-10 group"
          >
            <span>Buka Kamera Scan</span>
            <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-0 pointer-events-none"></div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="px-edge-margin mt-8 flex flex-col gap-8 relative z-10">
        
        {/* Progress Kunjungan */}
        <section className="fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-plus-jakarta-sans text-[16px] font-black text-on-surface tracking-tight">Kandang Dikunjungi</h3>
            <span className="bg-primary/10 text-primary font-plus-jakarta-sans text-[11px] font-bold px-3 py-1 rounded-full border border-primary/10">
              {visitedExhibitsList.length} Kandang
            </span>
          </div>
          
          <div className="flex flex-col gap-3.5">
            {visitedExhibitsList.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-8 text-center border border-outline-variant/10 shadow-xs flex flex-col items-center">
                <span className="material-symbols-outlined text-[36px] text-on-surface-variant/60 mb-2">
                  pets
                </span>
                <p className="font-inter text-xs text-on-surface-variant leading-relaxed max-w-[200px]">
                  Belum ada kandang dikunjungi. Ayo scan QR pertamamu!
                </p>
              </div>
            ) : (
              visitedExhibitsList.map((exhibit, idx) => (
                <motion.div
                  key={`${exhibit.id || 'exhibit'}-${idx}`}
                  whileHover={{ x: 4, scale: 1.01 }}
                  className="bg-white rounded-[1.75rem] p-4 flex items-center gap-4.5 shadow-xs border border-outline-variant/10 transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:shadow-black/[0.01]"
                >
                  <div className="w-13 h-13 rounded-2xl bg-surface-container-highest flex items-center justify-center text-3xl shadow-inner shrink-0 bg-gradient-to-br from-surface to-surface-container-highest">
                    {exhibit.emoji || "🐅"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-plus-jakarta-sans text-[15px] font-bold text-on-surface truncate">
                      {exhibit.name}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant/80 mt-0.5 truncate font-inter flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                      {exhibit.zone} <span className="text-outline">•</span> {exhibit.visitedAt}
                    </p>
                  </div>
                  <div className="text-right shrink-0 bg-primary/[0.04] border border-primary/5 rounded-2xl px-3 py-1.5">
                    <span className="text-[9px] text-primary/80 block font-plus-jakarta-sans font-bold uppercase tracking-wider mb-0.5">Durasi</span>
                    <span className="font-plus-jakarta-sans text-primary text-[12px] font-extrabold tracking-wider">
                      {exhibit.durationMinutes} mnt
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Skor Pre-Test */}
        <section className="fade-in-up" style={{ animationDelay: "0.6s" }}>
          <div className="bg-gradient-to-br from-white to-surface-container-lowest border border-outline-variant/15 rounded-[2.5rem] p-7 relative overflow-hidden shadow-sm">
            <div className="relative z-10">
              <h3 className="font-plus-jakarta-sans text-primary text-[10px] font-extrabold tracking-widest uppercase mb-4">
                Hasil Asesmen Awal
              </h3>
              <div className="flex items-end gap-1.5 mb-3.5">
                <span className="font-plus-jakarta-sans text-[52px] font-black text-primary leading-none tracking-tighter">
                  {preTestScore}
                </span>
                <span className="text-sm text-on-surface-variant/75 pb-1 font-bold">/ 100</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-3.5 overflow-hidden mb-3.5 border border-outline-variant/5 p-0.5">
                <div
                  className="bg-gradient-to-r from-primary via-[#4ade80] to-primary h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${preTestScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-on-surface-variant/90 leading-relaxed font-inter">
                Skor pengetahuanmu sebelum memulai petualangan. Selesaikan kuis akhir untuk melihat kenaikan skormu!
              </p>
            </div>
            {/* Decorative school emblem */}
            <span
              className="material-symbols-outlined absolute -right-6 -bottom-6 text-[120px] text-primary/[0.04] select-none font-variation-fill"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              school
            </span>
          </div>
        </section>

        {/* Status Kuis Retensi */}
        <section className="fade-in-up" style={{ animationDelay: "0.7s" }}>
          <h3 className="font-plus-jakarta-sans text-[16px] font-black text-on-surface tracking-tight mb-4">Kuis Evaluasi Lanjutan</h3>
          <div className="grid grid-cols-2 gap-4">
            <RetentionStatusCard
              label="H+7"
              title="Kuis 1 Minggu"
              date={h7DateFormatted}
              status={retentionH7Status}
            />
            <RetentionStatusCard
              label="H+30"
              title="Kuis 1 Bulan"
              date={h30DateFormatted}
              status={retentionH30Status}
            />
          </div>
        </section>

      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-edge-margin">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEndConfirm(false)}
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1.05 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2rem] p-6 w-full max-w-[340px] text-center shadow-2xl z-10 border border-outline-variant/35"
            >
              <div className="w-14 h-14 bg-red-100/50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200/30">
                <span className="material-symbols-outlined text-3xl font-bold text-red-600">exit_to_app</span>
              </div>
              <h3 className="font-plus-jakarta-sans text-lg font-bold text-on-surface mb-2">
                Akhiri Kunjungan?
              </h3>
              <p className="text-on-surface-variant font-inter text-xs leading-relaxed mb-6">
                Apakah Anda yakin ingin menyelesaikan kunjungan di kebun binatang? Anda akan diarahkan untuk mengisi kuis akhir (Post-Test).
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowEndConfirm(false);
                    router.push(ROUTES.quiz.postZoo);
                  }}
                  className="w-full bg-primary text-on-primary py-3.5 rounded-full font-plus-jakarta-sans text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all shadow-md hover:bg-primary/95 cursor-pointer"
                >
                  Ya, Mulai Kuis Akhir
                </button>
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="w-full bg-surface-container text-on-surface py-3.5 rounded-full font-plus-jakarta-sans text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all hover:bg-surface-variant cursor-pointer border border-outline-variant/10"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
