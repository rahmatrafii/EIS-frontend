// src/app/(visitor)/profile/retention-status/RetentionStatusContent.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { getUserProfile } from "@/services/auth.service";
import { getSessionHistory } from "@/services/session.service";
import { getRetentionStatus } from "@/services/quiz.service";
import { PageTransition } from "@/components/layout/PageTransition";
import { ROUTES } from "@/constants/routes";
import { PageLoader } from "@/components/ui/PageLoader";

import type { UserProfile } from "@/types/user.types";
import type { VisitSession } from "@/types/session.types";
import type { RetentionStatus, RetentionQuizStatus } from "@/types/quiz.types";

interface QuizDetail {
  type: string;
  status: RetentionQuizStatus;
  scheduleDate: string;
  completionDate?: string;
  completionDateRaw?: string;
  score?: number;
  countdown?: string;
  token?: string;
  sentAt?: string;
  expiresAt?: string;
}

interface VisitSessionData {
  visitDate: string;
  exhibitCount: number;
  finalEisScore?: number;
  grade?: string;
  quizzes: QuizDetail[];
}

export function RetentionStatusContent() {
  const router = useRouter();

  // API Data States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<VisitSession[]>([]);
  const [retention, setRetention] = useState<RetentionStatus | null>(null);

  // Layout States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Time remaining state for dynamic countdown timer
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const [profileRes, historyRes, retentionRes] = await Promise.all([
        getUserProfile(),
        getSessionHistory(),
        getRetentionStatus(),
      ]);

      if (profileRes.success) {
        setProfile(profileRes.data);
      } else {
        setErrorMsg(profileRes.error.message || "Gagal memuat profil.");
        setIsLoading(false);
        return;
      }

      if (historyRes.success) {
        setSessions(historyRes.data);
      }

      if (retentionRes.success) {
        setRetention(retentionRes.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data status retensi:", err);
      setErrorMsg("Koneksi internet bermasalah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Find the next upcoming quiz schedule (either SENT or PENDING)
  const getNextUpcomingQuiz = () => {
    if (!retention?.schedules || retention.schedules.length === 0) return null;

    // Filter schedules that are active (SENT) or future (PENDING)
    const activeOrFuture = retention.schedules.filter(
      (s: any) => s.status === "SENT" || s.status === "PENDING"
    );

    if (activeOrFuture.length === 0) return null;

    const getTargetTime = (s: any) => {
      if (s.status === "SENT") {
        return new Date(s.sentAt).getTime() + 24 * 60 * 60 * 1000;
      }
      return new Date(s.scheduledAt).getTime();
    };

    activeOrFuture.sort((a: any, b: any) => {
      if (a.status === "SENT" && b.status !== "SENT") return -1;
      if (a.status !== "SENT" && b.status === "SENT") return 1;
      return getTargetTime(a) - getTargetTime(b);
    });

    return activeOrFuture[0];
  };

  const nextQuiz = getNextUpcomingQuiz();

  const getTargetDate = (s: any) => {
    if (!s) return null;
    if (s.status === "SENT") {
      return new Date(new Date(s.sentAt).getTime() + 24 * 60 * 60 * 1000);
    }
    return new Date(s.scheduledAt);
  };

  const targetDate = getTargetDate(nextQuiz);

  // Real-time Countdown Timer effect
  useEffect(() => {
    if (!targetDate) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      return;
    }

    const updateTimer = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 60000); // update every minute

    return () => clearInterval(timer);
  }, [targetDate]);

  if (errorMsg) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 text-center min-h-[600px]">
        <div className="p-4 bg-error-container/40 rounded-full mb-4">
          <RefreshCw className="h-8 w-8 text-error animate-pulse" />
        </div>
        <h3 className="font-plus-jakarta-sans text-[18px] font-bold text-on-surface mb-2">
          Gagal Memuat Status
        </h3>
        <p className="font-inter text-sm text-on-surface-variant mb-6 max-w-[280px]">
          {errorMsg}
        </p>
        <button
          onClick={loadData}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-plus-jakarta-sans text-sm font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader text="Memuat status kuis retensimu..." minHeight="min-h-[600px]" />;
  }

  // Formatting date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  };

  // Helper: hitung grade dari skor EIS per sesi
  const getGradeFromScore = (score: number): string => {
    if (score >= 90) return "S";
    if (score >= 75) return "A";
    if (score >= 60) return "B";
    if (score >= 45) return "C";
    return "D";
  };

  const getCountdownLabel = (targetDateString: string) => {
    const diffTime = new Date(targetDateString).getTime() - new Date().getTime();
    if (diffTime <= 0) return "Hari ini";
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} hari lagi`;
  };

  // Map real sessions to VisitSessionData
  const retentionDataList: VisitSessionData[] = sessions.map((session) => {
    // Find matching schedules for this session
    const h7 = retention?.schedules?.find(
      (s: any) => s.sessionId === session.id && s.quizType === "RETENTION_1W"
    );
    const h30 = retention?.schedules?.find(
      (s: any) => s.sessionId === session.id && s.quizType === "RETENTION_1M"
    );

    const quizzes: QuizDetail[] = [];

    // Map H+7
    if (h7) {
      quizzes.push({
        type: "H+7",
        status: h7.status,
        scheduleDate: formatDate(h7.scheduledAt),
        completionDate: h7.completedAt ? formatDate(h7.completedAt) : undefined,
        completionDateRaw: h7.completedAt || undefined,
        score: h7.score !== null && h7.score !== undefined ? h7.score : undefined,
        token: h7.token || undefined,
        countdown: h7.status === "PENDING" ? getCountdownLabel(h7.scheduledAt) : undefined,
        sentAt: h7.sentAt || undefined,
        expiresAt: h7.expiresAt || undefined,
      });
    } else {
      const fallbackDate = new Date(session.checkOutAt || session.checkInAt);
      fallbackDate.setDate(fallbackDate.getDate() + 7);
      quizzes.push({
        type: "H+7",
        status: "PENDING",
        scheduleDate: formatDate(fallbackDate.toISOString()),
        expiresAt: fallbackDate.toISOString(),
      });
    }

    // Map H+30
    if (h30) {
      quizzes.push({
        type: "H+30",
        status: h30.status,
        scheduleDate: formatDate(h30.scheduledAt),
        completionDate: h30.completedAt ? formatDate(h30.completedAt) : undefined,
        completionDateRaw: h30.completedAt || undefined,
        score: h30.score !== null && h30.score !== undefined ? h30.score : undefined,
        token: h30.token || undefined,
        countdown: h30.status === "PENDING" ? getCountdownLabel(h30.scheduledAt) : undefined,
        sentAt: h30.sentAt || undefined,
        expiresAt: h30.expiresAt || undefined,
      });
    } else {
      const fallbackDate = new Date(session.checkOutAt || session.checkInAt);
      fallbackDate.setDate(fallbackDate.getDate() + 30);
      quizzes.push({
        type: "H+30",
        status: "PENDING",
        scheduleDate: formatDate(fallbackDate.toISOString()),
        expiresAt: fallbackDate.toISOString(),
      });
    }

    return {
      visitDate: formatDate(session.visitDate),
      exhibitCount: session.totalExhibitsVisited ?? 0,
      finalEisScore: session.eisScore !== null && session.eisScore !== undefined ? session.eisScore : undefined,
      grade: session.eisScore ? getGradeFromScore(session.eisScore) : undefined,
      quizzes,
    };
  });

  const emailDisplay = profile?.email || "rahmat@email.com";

  return (
    <PageTransition className="flex flex-col flex-grow pb-[110px] bg-[#f8f9fa] select-none text-[#191c1d] relative min-h-screen">
      {/* TopAppBar */}
      <header className="bg-primary px-6 pb-8 pt-12 flex flex-col items-center relative shadow-sm">
        <button
          onClick={() => router.push(ROUTES.profile)}
          className="absolute left-6 top-[52px] text-on-primary flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
          aria-label="Kembali"
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>
            arrow_back
          </span>
        </button>
        <h1 className="font-plus-jakarta-sans text-[20px] font-bold text-on-primary leading-[28px]">
          Status Kuis Retensi
        </h1>
        <p className="font-inter text-[14px] text-on-primary/80 mt-1 text-center leading-[20px]">
          Pantau jadwal kuis lanjutan kunjunganmu
        </p>
      </header>

      {/* Countdown Timer */}
      <section className="mx-6 -mt-6 relative z-10 bg-gradient-to-br from-[#0051d5] to-[#003ea8] rounded-[24px] p-6 shadow-lg text-center flex flex-col items-center">
        <span className="text-[40px] mb-2 leading-none">⏰</span>
        <p className="font-plus-jakarta-sans text-[12px] font-bold tracking-wider uppercase text-white/70 mb-1 leading-[16px]">
          {nextQuiz?.status === "SENT" ? "Batas Waktu Pengisian:" : "Kuis Berikutnya:"}
        </p>
        <h2 className="font-plus-jakarta-sans text-[18px] font-semibold text-white mb-4 leading-[24px]">
          {nextQuiz ? (
            `Kuis ${nextQuiz.quizType === "RETENTION_1W" ? "H+7" : "H+30"} — Kunjungan ${
              sessions.find((s) => s.id === nextQuiz.sessionId)?.visitDate
                ? formatDate(sessions.find((s) => s.id === nextQuiz.sessionId)!.visitDate)
                : ""
            }`
          ) : (
            "Tidak Ada Kuis Aktif"
          )}
        </h2>

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex flex-col items-center">
            <div className="bg-white/20 rounded-[12px] w-16 h-16 flex items-center justify-center font-plus-jakarta-sans text-[24px] font-bold text-white mb-1 leading-[32px]">
              {String(timeLeft.days).padStart(2, "0")}
            </div>
            <span className="font-plus-jakarta-sans text-[10px] text-white/80 uppercase tracking-wider font-bold">
              Hari
            </span>
          </div>
          <span className="font-plus-jakarta-sans text-[24px] text-white/50 pb-5 leading-[32px] font-bold">:</span>
          <div className="flex flex-col items-center">
            <div className="bg-white/20 rounded-[12px] w-16 h-16 flex items-center justify-center font-plus-jakarta-sans text-[24px] font-bold text-white mb-1 leading-[32px]">
              {String(timeLeft.hours).padStart(2, "0")}
            </div>
            <span className="font-plus-jakarta-sans text-[10px] text-white/80 uppercase tracking-wider font-bold">
              Jam
            </span>
          </div>
          <span className="font-plus-jakarta-sans text-[24px] text-white/50 pb-5 leading-[32px] font-bold">:</span>
          <div className="flex flex-col items-center">
            <div className="bg-white/20 rounded-[12px] w-16 h-16 flex items-center justify-center font-plus-jakarta-sans text-[24px] font-bold text-white mb-1 leading-[32px]">
              {String(timeLeft.minutes).padStart(2, "0")}
            </div>
            <span className="font-plus-jakarta-sans text-[10px] text-white/80 uppercase tracking-wider font-bold">
              Menit
            </span>
          </div>
        </div>

        <p className="font-plus-jakarta-sans text-[11px] text-white/50 font-bold">
          {nextQuiz?.status === "SENT"
            ? `Kuis telah dikirim ke ${emailDisplay}`
            : nextQuiz?.status === "PENDING"
            ? `Kuis akan dikirim ke ${emailDisplay}`
            : "Semua kuis retensi telah diselesaikan"}
        </p>
      </section>

      {/* Main Content Card Wrapper */}
      <main className="flex-grow mt-8 flex flex-col gap-8">
        {retentionDataList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <span className="material-symbols-outlined text-[48px] text-[#0051d5]/30 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
              explore
            </span>
            <h4 className="font-plus-jakarta-sans text-[16px] font-bold text-[#191c1d] mb-2">
              Belum Ada Riwayat Kuis Retensi
            </h4>
            <p className="font-inter text-sm text-on-surface-variant max-w-[260px]">
              Status kuis retensimu akan muncul di sini setelah kamu menyelesaikan kunjungan pertama.
            </p>
          </div>
        ) : (
          retentionDataList.map((session, idx) => (
            <section key={idx} className="flex flex-col">
              <div className="flex justify-between items-center mb-3 px-6">
                <div>
                  <h3 className="font-plus-jakarta-sans text-[16px] font-bold text-[#191c1d]">
                    {session.visitDate}
                  </h3>
                  <p className="font-inter text-[12px] text-on-surface-variant">
                    {session.exhibitCount} Eksibit dikunjungi
                  </p>
                </div>
                {session.finalEisScore !== undefined && (
                  <div className="bg-[#22c55e]/10 text-[#22c55e] px-3 py-1 rounded-full font-plus-jakarta-sans text-[12px] font-semibold border border-[#22c55e]/20">
                    EIS: {session.finalEisScore} (Grade {session.grade})
                  </div>
                )}
              </div>

              <div className="flex gap-4 px-6 overflow-x-auto pb-2 scrollbar-thin">
                {session.quizzes.map((quiz, quizIdx) => {
                  let bg = "",
                    border = "",
                    icon = "",
                    badge = "",
                    badgeColor = "";

                  switch (quiz.status) {
                    case "PENDING":
                      bg = "bg-[#eff6ff]";
                      border = "border-[#bfdbfe]";
                      icon = "⏳";
                      badge = "Menunggu";
                      badgeColor = "text-[#0051d5] bg-[#0051d5]/10 border border-[#0051d5]/20";
                      break;
                    case "SENT":
                      bg = "bg-[#fffbeb]";
                      border = "border-[#fde68a]";
                      icon = "📧";
                      badge = "Email Terkirim";
                      badgeColor = "text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20";
                      break;
                    case "COMPLETED":
                      bg = "bg-[#f0fdf4]";
                      border = "border-[#86efac]";
                      icon = "✅";
                      badge = "Selesai";
                      badgeColor = "text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20";
                      break;
                    case "EXPIRED":
                      bg = "bg-[#fef2f2]";
                      border = "border-[#fecaca]";
                      icon = "❌";
                      badge = "Kadaluarsa";
                      badgeColor = "text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20";
                      break;
                  }

                  return (
                    <div
                      key={quizIdx}
                      className={`flex-none w-[260px] rounded-[16px] p-4 border ${border} ${bg} flex flex-col justify-between shadow-sm`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="font-plus-jakarta-sans text-[12px] font-bold text-[#191c1d]">
                            {quiz.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full font-plus-jakarta-sans text-[10px] font-bold ${badgeColor} flex items-center gap-1`}>
                            <span>{icon}</span> <span>{badge}</span>
                          </span>
                        </div>
                        <p className="font-inter text-[12px] text-[#374151] mb-1">
                          Jadwal: {quiz.scheduleDate}
                        </p>

                        {quiz.status === "PENDING" && (
                          <div className="mt-1">
                            <p className="font-inter text-[12px] italic text-[#0051d5] font-semibold">
                              {quiz.countdown}
                            </p>
                            {quiz.expiresAt && (
                              <p className="font-inter text-[10px] text-[#4b5563] mt-1">
                                Rencana Buka: {formatDateTime(quiz.expiresAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {quiz.status === "SENT" && (
                          <div className="mt-1">
                            {quiz.sentAt && (
                              <p className="font-inter text-[10px] text-[#4b5563] mt-1">
                                Dibuka: {formatDateTime(quiz.sentAt)}
                              </p>
                            )}
                            {quiz.expiresAt && (
                              <p className="font-inter text-[10px] text-[#dc2626] font-semibold mt-0.5">
                                Batas Waktu: {formatDateTime(quiz.expiresAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {quiz.status === "COMPLETED" && (
                          <div className="mt-2">
                            <div className="flex items-baseline gap-1 text-[#22c55e]">
                              <span className="font-plus-jakarta-sans text-[24px] font-bold leading-none">
                                {quiz.score}
                              </span>
                              <span className="font-plus-jakarta-sans text-[10px] font-bold">/ 100</span>
                            </div>
                            {quiz.completionDateRaw && (
                              <p className="font-inter text-[10px] text-[#374151] mt-1">
                                Dikerjakan: {formatDateTime(quiz.completionDateRaw)}
                              </p>
                            )}
                          </div>
                        )}

                        {quiz.status === "EXPIRED" && (
                          <div className="mt-2">
                            <span className="font-plus-jakarta-sans text-[20px] font-bold text-[#f87171] leading-none">
                              -
                            </span>
                            <p className="font-inter text-[10px] text-[#f87171] mt-1 font-semibold">
                              Batas waktu telah lewat
                            </p>
                            {quiz.expiresAt && (
                              <p className="font-inter text-[10px] text-[#f87171]/95 mt-0.5 font-medium">
                                Expired: {formatDateTime(quiz.expiresAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {quiz.status === "SENT" && (
                        <button
                          onClick={() => router.push(ROUTES.retention(quiz.token || ""))}
                          className="mt-4 w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-white font-plus-jakarta-sans text-[14px] font-semibold py-2 rounded-xl active:scale-[0.98] transition-all cursor-pointer select-none text-center shadow-md shadow-[#f59e0b]/10"
                        >
                          Buka Kuis →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {/* Explain Card Info (Legend) */}
        <section className="mx-6 mb-8 bg-white border border-[#e2e2e2] rounded-[16px] p-4 shadow-sm">
          <h4 className="font-plus-jakarta-sans text-[14px] font-bold mb-3 text-[#191c1d] flex items-center gap-1.5">
            Keterangan Status
          </h4>
          <ul className="space-y-2 font-inter text-[12px] text-[#3f493f]">
            <li className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0051d5] shrink-0"></span>
              <span>Menunggu: Belum masuk jadwal</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0"></span>
              <span>Email Terkirim: Kuis siap dikerjakan</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shrink-0"></span>
              <span>Selesai: Nilai sudah keluar</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f87171] shrink-0"></span>
              <span>Kadaluarsa: Lewat batas 24 jam</span>
            </li>
          </ul>
        </section>
      </main>
    </PageTransition>
  );
}
