// src/app/(visitor)/profile/ProfileContent.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, Mail, Calendar, User, ShieldAlert, LogOut, ChevronRight, ArrowLeft } from "lucide-react";

import { getUserProfile } from "@/services/auth.service";
import { getSessionHistory } from "@/services/session.service";
import { getRetentionStatus } from "@/services/quiz.service";
import { getEisScore } from "@/services/analytics.service";
import { useToast } from "@/stores/ToastContext";
import { ROUTES } from "@/constants/routes";
import { PageTransition } from "@/components/layout/PageTransition";
import { removeToken, clearActiveSessionId } from "@/lib/token";
import { getAgeCategoryLabel } from "@/lib/age";
import { fadeInUp, fadeIn, scaleIn, staggerContainer, staggerItem } from "@/lib/animations";
import { PageLoader } from "@/components/ui/PageLoader";

import type { UserProfile } from "@/types/user.types";
import type { VisitSession } from "@/types/session.types";
import type { RetentionStatus } from "@/types/quiz.types";
import type { EisScore } from "@/types/analytics.types";

type ActiveTab = "profil" | "riwayat" | "retensi";

interface HistoricVisit {
  id: number;
  visitDate: string;
  name: string;
  grade: string;
  preScore: number;
  postScore: number;
  eisScore: number;
  durationMinutes: number;
}

export function ProfileContent() {
  const router = useRouter();
  const { toast } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>("profil");

  // Data State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<VisitSession[]>([]);
  const [retention, setRetention] = useState<RetentionStatus | null>(null);
  const [eisScoreData, setEisScoreData] = useState<EisScore | null>(null);

  // Layout States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState<boolean>(false);

  // Fetch all profile data
  const loadProfileData = useCallback(async () => {
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

        // Fase 3.2: Ambil skor EIS dari backend
        const eisRes = await getEisScore(profileRes.data.id);
        if (eisRes.success) {
          setEisScoreData(eisRes.data);
        }
      } else {
        setErrorMsg(profileRes.error.message || "Gagal memuat profil pengguna.");
      }

      if (historyRes.success) {
        setSessions(historyRes.data);
      }

      if (retentionRes.success) {
        setRetention(retentionRes.data);
      }
    } catch (err) {
      console.error("Gagal memuat profil:", err);
      setErrorMsg("Koneksi internet bermasalah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Action: Logout
  const handleLogout = () => {
    // Clear cookies
    document.cookie = "eis_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "eis_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Clear Storage
    removeToken();
    clearActiveSessionId();
    sessionStorage.removeItem("email");

    // Close Dialog
    setShowLogout(false);
    toast.success("Berhasil keluar.");

    // Redirect to Welcome page
    router.replace(ROUTES.welcome);
  };



  if (errorMsg) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 text-center min-h-[600px]">
        <div className="p-4 bg-error-container/40 rounded-full mb-4">
          <RefreshCw className="h-8 w-8 text-error animate-pulse" />
        </div>
        <h3 className="font-plus-jakarta-sans text-[18px] font-bold text-on-surface mb-2">
          Gagal Memuat Profil
        </h3>
        <p className="font-inter text-sm text-on-surface-variant mb-6 max-w-[280px]">
          {errorMsg}
        </p>
        <button
          onClick={loadProfileData}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-plus-jakarta-sans text-sm font-semibold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader text="Memuat data profilmu..." minHeight="min-h-[600px]" />;
  }

  // Display calculations
  const fullName = profile?.name || "";
  const email = profile?.email || "";
  const age = profile?.age || 0;

  // Initial Avatar (e.g. Rahmat Rafi -> RR)
  const avatarInitials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Age category text
  const categoryFull = getAgeCategoryLabel(age);
  const categoryLabel = categoryFull.includes("Anak-anak")
    ? "Anak-anak"
    : categoryFull.includes("Remaja")
    ? "Remaja"
    : categoryFull.includes("Balita")
    ? "Balita"
    : "Dewasa";

  // Statistik Edukasi dari backend
  const totalVisitsCount = sessions.length;
  const avgEisScore = eisScoreData?.finalEisScore ?? 0;
  const bestGrade = eisScoreData ? `Grade ${eisScoreData.grade}` : "-";

  // Helper: hitung grade dari skor EIS per sesi
  const getGradeFromScore = (score: number): string => {
    if (score >= 90) return "S";
    if (score >= 75) return "A";
    if (score >= 60) return "B";
    if (score >= 45) return "C";
    return "D";
  };

  // Riwayat Kunjungan dari data sesi backend
  const formattedHistoryList: HistoricVisit[] = sessions.map((s, index) => {
    const dateFormatted = new Date(s.visitDate).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const sessionEisScore = s.eisScore ?? s.postScore ?? 0;
    const sessionPreScore = s.preScore ?? 0;
    const sessionPostScore = s.postScore ?? 0;

    return {
      id: s.id,
      visitDate: dateFormatted,
      name: `Petualangan ZOO #${sessions.length - index}`,
      grade: getGradeFromScore(sessionEisScore),
      preScore: sessionPreScore,
      postScore: sessionPostScore,
      eisScore: sessionEisScore,
      durationMinutes: s.checkOutAt
        ? Math.max(1, Math.round((new Date(s.checkOutAt).getTime() - new Date(s.checkInAt).getTime()) / 60000))
        : 0,
    };
  });

  // Retention dynamic calculations
  const h7Status = retention?.h7?.status || "SENT";
  const h30Status = retention?.h30?.status || "PENDING";

  const h7Schedule = retention?.schedules?.find((s: any) => s.quizType === "RETENTION_1W");
  const h30Schedule = retention?.schedules?.find((s: any) => s.quizType === "RETENTION_1M");

  const h7Session = h7Schedule ? sessions.find((s) => s.id === h7Schedule.sessionId) : null;
  const h30Session = h30Schedule ? sessions.find((s) => s.id === h30Schedule.sessionId) : null;

  const formatVisitDate = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const h7VisitDate = h7Session ? formatVisitDate(h7Session.visitDate) : (sessions[0] ? formatVisitDate(sessions[0].visitDate) : "");
  const h30VisitDate = h30Session ? formatVisitDate(h30Session.visitDate) : (sessions[0] ? formatVisitDate(sessions[0].visitDate) : "");

  const getH7Countdown = () => {
    if (!h7Schedule || h7Schedule.status !== "SENT") return "0J 0M";
    
    const limitTime = new Date(h7Schedule.sentAt).getTime() + 24 * 60 * 60 * 1000;
    const diffMs = limitTime - Date.now();
    
    if (diffMs <= 0) return "0J 0M";
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}J ${minutes}M`;
  };

  const renderRetentionCard = (
    status: string,
    schedule: any,
    visitDate: string,
    label: string,
    title: string
  ) => {
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

    if (status === "SENT") {
      return (
        <div className="bg-gradient-to-br from-primary via-[#005c24] to-[#002f12] text-on-primary rounded-[2rem] p-6 shadow-xl shadow-primary/10 relative overflow-hidden border border-white/10">
          <div aria-hidden="true" className="absolute w-40 h-40 rounded-full bg-[#95f8a7]/10 blur-2xl -right-10 -top-10 z-0 pointer-events-none" />
          <div aria-hidden="true" className="absolute w-40 h-40 rounded-full bg-primary/20 blur-2xl -left-10 -bottom-10 z-0 pointer-events-none" />
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="bg-white/10 text-[#95f8a7] px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border border-white/10">
              Tersedia
            </span>
            <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-white/70">
              Kunjungan {visitDate || "ZOO"}
            </span>
          </div>
          
          <h4 className="font-plus-jakarta-sans text-[20px] font-black tracking-tight text-white mb-1.5 relative z-10">
            {title}
          </h4>
          <p className="font-inter text-xs text-white/85 mb-5 relative z-10 leading-relaxed">
            Uji ingatanmu tentang satwa di Safari Explorer!
            {schedule?.sentAt && (
              <span className="block mt-1 text-[10px] text-[#95f8a7] font-semibold">
                Dibuka: {formatDateTime(schedule.sentAt)}
              </span>
            )}
          </p>
          
          <div className="flex flex-col gap-3 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white/95">
                <span className="material-symbols-outlined text-sm text-[#95f8a7] font-bold">timer</span>
                <span className="font-plus-jakarta-sans text-[10px] font-extrabold tracking-wider uppercase">Sisa Waktu:</span>
              </div>
              <span className="font-plus-jakarta-sans text-sm font-black text-[#95f8a7] tracking-wider">{label === "H+7" ? getH7Countdown() : "24J 0M"}</span>
            </div>
            
            <button
              onClick={() => router.push(ROUTES.retention(schedule?.token || ""))}
              className="bg-gradient-to-r from-[#95f8a7] to-[#00ff73] text-[#003d16] hover:brightness-105 active:scale-[0.98] transition-all py-3.5 rounded-full font-plus-jakarta-sans text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-black/10 cursor-pointer"
            >
              <span>Mulai Kuis</span>
              <span className="material-symbols-outlined text-xs font-black">arrow_forward</span>
            </button>
          </div>
        </div>
      );
    }

    if (status === "COMPLETED") {
      return (
        <div className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2rem] p-5 backdrop-blur-lg flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/15 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 select-none">
                <span className="material-symbols-outlined text-[10px] font-bold">check_circle</span> Selesai
              </span>
              <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-outline/80">
                Kunjungan {visitDate || "ZOO"}
              </span>
            </div>
            <h4 className="font-plus-jakarta-sans text-[15px] font-bold text-on-surface">{title}</h4>
            <p className="font-inter text-xs text-on-surface-variant mt-1.5 font-medium">
              Skor: <span className="text-primary font-black">{schedule?.score !== undefined && schedule?.score !== null ? schedule.score : 0}/100</span>
              {schedule?.completedAt && (
                <span className="block mt-1 text-[10px] text-on-surface-variant/80 font-normal">
                  Dikerjakan: {formatDateTime(schedule.completedAt)}
                </span>
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center text-emerald-600 border border-emerald-500/10 shrink-0 ml-4 shadow-sm">
            <span className="material-symbols-outlined font-variation-fill" style={{ fontVariationSettings: "'FILL' 1" }}>
              emoji_events
            </span>
          </div>
        </div>
      );
    }

    if (status === "EXPIRED") {
      return (
        <div className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-md rounded-[2rem] p-5 backdrop-blur-lg flex items-center justify-between opacity-80">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-500/10 text-red-700 border border-red-500/15 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 select-none">
                <span className="material-symbols-outlined text-[10px] font-bold">cancel</span> Kadaluarsa
              </span>
              <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-outline/80">
                Kunjungan {visitDate || "ZOO"}
              </span>
            </div>
            <h4 className="font-plus-jakarta-sans text-[15px] font-bold text-on-surface">{title}</h4>
            <p className="font-inter text-xs text-on-surface-variant mt-1.5 font-medium">
              Batas waktu pengisian kuis telah habis.
              {schedule?.expiresAt && (
                <span className="block mt-1 text-[10px] text-error/80 font-semibold">
                  Batas Waktu: {formatDateTime(schedule.expiresAt)}
                </span>
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shrink-0 ml-4 border border-red-100">
            <span className="material-symbols-outlined font-variation-fill text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              cancel
            </span>
          </div>
        </div>
      );
    }

    if (status === "PENDING") {
      return (
        <div className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-md rounded-[2rem] p-5 backdrop-blur-lg flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/10 text-amber-700 border border-amber-500/15 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 select-none">
                <span className="material-symbols-outlined text-[10px] font-bold">hourglass_empty</span> Menunggu
              </span>
              <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-outline/80">
                Kunjungan {visitDate || "ZOO"}
              </span>
            </div>
            <h4 className="font-plus-jakarta-sans text-[15px] font-bold text-on-surface">{title}</h4>
            <p className="font-inter text-xs text-on-surface-variant mt-1.5 font-medium">
              Menunggu jadwal pengiriman kuis oleh sistem.
              {schedule?.expiresAt && (
                <span className="block mt-1 text-[10px] text-amber-600 font-semibold">
                  Rencana Buka: {formatDateTime(schedule.expiresAt)}
                </span>
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 ml-4 border border-amber-100">
            <span className="material-symbols-outlined font-variation-fill text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              hourglass_empty
            </span>
          </div>
        </div>
      );
    }

    // Default: LOCKED status
    return (
      <div className="bg-white/50 border border-outline-variant/10 shadow-sm rounded-[2rem] p-5 flex items-center justify-between opacity-70">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-surface-container-high text-on-surface-variant/70 border border-outline-variant/10 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 select-none">
              <span className="material-symbols-outlined text-[10px] font-bold">lock</span> Terkunci
            </span>
            <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-outline/80">
              Kunjungan {visitDate || "ZOO"}
            </span>
          </div>
          <h4 className="font-plus-jakarta-sans text-[15px] font-bold text-on-surface">{title}</h4>
          <p className="font-inter text-xs text-on-surface-variant mt-1.5 font-medium">
            Terbuka pada {schedule?.expiresAt ? new Date(schedule.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Waktu yang dijadwalkan"}
            {schedule?.expiresAt && (
              <span className="block mt-1 text-[10px] text-on-surface-variant/70 font-semibold">
                Rencana Buka: {formatDateTime(schedule.expiresAt)}
              </span>
            )}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/60 shrink-0 ml-4">
          <span className="material-symbols-outlined font-variation-fill text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            lock
          </span>
        </div>
      </div>
    );
  };

  const hasActiveSession = sessions.some((s) => !s.isCompleted);

  return (
    <PageTransition className="h-full overflow-y-auto overflow-x-hidden relative pb-8 bg-[#f7faf6] flex flex-col select-none">
      {/* Decorative Ambient Background Blobs */}
      <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
      <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

      {/* Top Header Card Area */}
      <header className="bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12] rounded-b-[2.5rem] px-edge-margin pt-[70px] pb-10 relative text-on-primary shadow-lg overflow-hidden flex flex-col items-center">
        {/* Glow Effects inside header */}
        <div
          aria-hidden="true"
          className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/15 blur-3xl -right-20 -top-20 z-0 pointer-events-none"
        ></div>
        <div
          aria-hidden="true"
          className="absolute w-60 h-60 rounded-full bg-primary/25 blur-3xl -left-20 -bottom-20 z-0 pointer-events-none"
        ></div>

        <div className="absolute top-[20px] left-4 right-4 flex justify-between items-center text-on-primary z-20">
          <button
            onClick={() => router.push(ROUTES.home)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 active:scale-90 transition-transform cursor-pointer"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="font-plus-jakarta-sans text-[18px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-[#95f8a7] to-white drop-shadow-md select-none uppercase">
            Profil
          </h1>
          <div className="w-10 h-10" />
        </div>

        {/* Profile Card & Bio */}
        <div className="mt-8 flex flex-col items-center relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#95f8a7] to-[#00ff73] p-[3px] shadow-lg shadow-black/20 select-none relative z-10">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#003d16] to-[#001f0a] flex items-center justify-center">
              <span className="font-plus-jakarta-sans font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-[#95f8a7] to-white select-none">
                {avatarInitials}
              </span>
            </div>
            {hasActiveSession && (
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#00ff73] border-2 border-[#001f0a] rounded-full shadow-md animate-pulse"></div>
            )}
          </div>
          <h2 className="mt-4 font-plus-jakarta-sans text-[20px] font-black text-white tracking-tight drop-shadow-sm text-center">
            {fullName}
          </h2>
          <div className="mt-2 flex items-center gap-1.5 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm shadow-sm">
            <User className="h-3.5 w-3.5 text-[#95f8a7] stroke-[2.5]" />
            <span className="font-plus-jakarta-sans text-[10px] font-extrabold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#95f8a7] to-white">
              {categoryLabel}
            </span>
          </div>
        </div>
      </header>

      {/* Sticky Segmented Tab Navigation */}
      <div className="px-edge-margin -mt-6 relative z-30">
        <nav className="bg-white/90 backdrop-blur-md border border-outline-variant/10 shadow-xl shadow-primary/5 rounded-full p-1.5 flex justify-between items-center max-w-sm mx-auto">
          {(["profil", "riwayat", "retensi"] as ActiveTab[]).map((tab) => {
            const label = tab === "profil" ? "Profil" : tab === "riwayat" ? "Riwayat" : "Retensi";
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-full font-plus-jakarta-sans text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-[#005c24] text-white shadow-md shadow-primary/10 active:scale-95"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-edge-margin py-8 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {/* TAB 1: PROFIL */}
          {activeTab === "profil" && (
            <motion.div
              key="tab-profil"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeInUp}
              className="flex flex-col gap-6"
            >
              {/* Personal Info Card */}
              <section className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2.5rem] p-6 backdrop-blur-lg relative overflow-hidden">
                <h3 className="font-plus-jakarta-sans text-[16px] font-black text-on-surface mb-5 tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg font-bold">badge</span>
                  Informasi Pribadi
                </h3>
                <div className="flex flex-col gap-4">
                  {/* Nama */}
                  <div className="flex items-center gap-4 bg-surface-container-lowest/50 p-3.5 rounded-2xl border border-outline-variant/5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary shrink-0">
                      <User className="h-5 w-5 stroke-[2]" />
                    </div>
                    <div>
                      <p className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-on-surface-variant/80">
                        Nama Lengkap
                      </p>
                      <p className="font-inter text-sm text-on-surface font-semibold mt-0.5">{fullName}</p>
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className="flex items-center gap-4 bg-surface-container-lowest/50 p-3.5 rounded-2xl border border-outline-variant/5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary shrink-0">
                      <Mail className="h-5 w-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-on-surface-variant/80">
                        Email
                      </p>
                      <p className="font-inter text-sm text-on-surface font-semibold mt-0.5 truncate">{email}</p>
                    </div>
                  </div>
                  
                  {/* Usia */}
                  <div className="flex items-center justify-between bg-surface-container-lowest/50 p-3.5 rounded-2xl border border-outline-variant/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary shrink-0">
                        <Calendar className="h-5 w-5 stroke-[2]" />
                      </div>
                      <div>
                        <p className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-on-surface-variant/80">
                          Usia
                        </p>
                        <p className="font-inter text-sm text-on-surface font-semibold mt-0.5">{age} Tahun</p>
                      </div>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase border border-primary/15">
                      {categoryLabel}
                    </div>
                  </div>
                </div>
              </section>

              {/* Stats Card */}
              <section className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2.5rem] p-6 backdrop-blur-lg">
                <h3 className="font-plus-jakarta-sans text-[16px] font-black text-on-surface mb-5 tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg font-bold">analytics</span>
                  Statistik Edukasi
                </h3>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-white rounded-2xl p-4 border border-outline-variant/10 flex flex-col items-center text-center shadow-xs">
                    <span className="material-symbols-outlined text-primary mb-2 font-variation-fill text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      tour
                    </span>
                    <span className="font-plus-jakarta-sans text-2xl font-black text-primary">
                      {totalVisitsCount}
                    </span>
                    <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-on-surface-variant/80 mt-1.5">
                      Kunjungan
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-outline-variant/10 flex flex-col items-center text-center shadow-xs">
                    <span className="material-symbols-outlined text-amber-500 mb-2 font-variation-fill text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      school
                    </span>
                    <span className="font-plus-jakarta-sans text-2xl font-black text-amber-500">
                      {avgEisScore}
                    </span>
                    <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-on-surface-variant/80 mt-1.5">
                      Rata-rata EIS
                    </span>
                  </div>
                  <div className="col-span-2 bg-gradient-to-r from-primary/[0.06] to-[#005c24]/[0.02] rounded-2xl p-4.5 border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary font-variation-fill text-[38px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        military_tech
                      </span>
                      <div>
                        <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-on-surface-variant/80 block">
                          Grade Terbaik
                        </span>
                        <span className="font-plus-jakarta-sans text-[18px] font-black text-primary block mt-0.5">
                          {bestGrade}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(ROUTES.score)}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md text-primary active:scale-90 transition-all hover:bg-primary hover:text-white border border-outline-variant/5 cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Logout Trigger Button */}
              <button
                onClick={() => setShowLogout(true)}
                className="mt-2 w-full h-14 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-600 active:scale-[0.98] transition-all rounded-full font-plus-jakarta-sans text-[13px] font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <LogOut className="h-5 w-5 text-red-600 stroke-[2.5]" />
                Keluar Akun
              </button>
            </motion.div>
          )}

          {/* TAB 2: RIWAYAT */}
          {activeTab === "riwayat" && (
            <motion.div
              key="tab-riwayat"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={staggerContainer}
              className="flex flex-col gap-4"
            >
              {formattedHistoryList.length === 0 ? (
                <motion.div
                  variants={staggerItem}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <span className="material-symbols-outlined text-[48px] text-[#00652c]/30 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
                    explore
                  </span>
                  <h4 className="font-plus-jakarta-sans text-[16px] font-bold text-on-surface mb-2">
                    Belum Ada Kunjungan
                  </h4>
                  <p className="font-inter text-sm text-on-surface-variant max-w-[260px]">
                    Riwayat kunjunganmu akan muncul di sini setelah kamu mengunjungi kebun binatang.
                  </p>
                </motion.div>
              ) : (
                formattedHistoryList.map((visit) => (
                  <motion.article
                    key={visit.id}
                    variants={staggerItem}
                    className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2rem] p-5 backdrop-blur-lg flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/10 rounded-full px-3 py-1 font-plus-jakarta-sans text-[9px] font-extrabold uppercase tracking-wider mb-2.5">
                          <span className="material-symbols-outlined text-[12px] font-bold">event</span> {visit.visitDate}
                        </span>
                        <h4 className="font-plus-jakarta-sans text-[18px] font-black text-on-surface leading-tight">
                          {visit.name}
                        </h4>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-surface to-surface-container-highest flex items-center justify-center text-primary shadow-inner border border-outline-variant/10 shrink-0">
                        <span className="font-plus-jakarta-sans text-[18px] font-black leading-none">{visit.grade}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 items-center bg-white/60 border border-outline-variant/5 p-3.5 rounded-2xl shadow-xs">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex justify-between font-plus-jakarta-sans text-[10px] font-extrabold tracking-wider uppercase">
                          <span className="text-on-surface-variant/80">Knowledge Gain</span>
                          <span className="text-primary">+{visit.postScore - visit.preScore}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden flex shadow-inner p-0.5 border border-outline-variant/5">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all"
                            style={{ width: `${visit.preScore}%` }}
                          ></div>
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${visit.postScore - visit.preScore}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between font-plus-jakarta-sans text-[9px] font-extrabold uppercase text-outline/80 mt-0.5">
                          <span>Pre: {visit.preScore}</span>
                          <span>Post: {visit.postScore}</span>
                        </div>
                      </div>
                      <div className="w-px h-10 bg-outline-variant/40 mx-2"></div>
                      <div className="flex flex-col items-center justify-center min-w-[50px] shrink-0">
                        <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase text-outline/80">
                          EIS
                        </span>
                        <span className="font-plus-jakarta-sans text-2xl font-black text-primary leading-none mt-1">
                          {visit.eisScore}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`${ROUTES.score}?session_id=${visit.id}`)}
                      className="w-full py-3.5 rounded-2xl bg-[#00652c]/5 hover:bg-[#00652c]/10 text-primary font-plus-jakarta-sans text-[13px] font-black tracking-widest uppercase active:scale-[0.98] transition-all cursor-pointer border border-[#00652c]/10"
                    >
                      Lihat Detail
                    </button>
                  </motion.article>
                ))
              )}
            </motion.div>
          )}

          {/* TAB 3: RETENSI */}
          {activeTab === "retensi" && (
            <motion.div
              key="tab-retensi"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeInUp}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-plus-jakarta-sans text-[16px] font-black text-on-surface tracking-tight">
                  Status Kuis Lanjutan
                </h3>

              </div>

              {renderRetentionCard(h7Status, h7Schedule, h7VisitDate, "H+7", "Kuis Retensi H+7")}
              {renderRetentionCard(h30Status, h30Schedule, h30VisitDate, "H+30", "Kuis Retensi H+30")}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* CONFIRM LOGOUT DIALOG (Framer Motion scaleIn) */}
      <AnimatePresence>
        {showLogout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeIn}
              onClick={() => setShowLogout(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            {/* Panel */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={scaleIn}
              className="bg-white/95 backdrop-blur-lg rounded-[2rem] p-6 w-full max-w-[320px] shadow-2xl relative z-10 border border-white/50 flex flex-col text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto border border-red-200">
                <LogOut className="h-6 w-6 text-red-600 stroke-[2.5]" />
              </div>
              <h3 className="font-plus-jakarta-sans text-[20px] font-black text-on-surface mb-2">
                Keluar Akun?
              </h3>
              <p className="font-inter text-xs text-on-surface-variant/90 mb-6 leading-relaxed">
                Kamu harus masuk kembali untuk melihat tiket dan riwayat kunjunganmu.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 py-3.5 rounded-full border border-outline-variant/40 text-on-surface font-plus-jakarta-sans text-xs font-bold tracking-wider uppercase hover:bg-surface-container-low active:scale-95 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3.5 rounded-full bg-red-600 text-white font-plus-jakarta-sans text-xs font-bold tracking-wider uppercase hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-md shadow-red-600/10"
                >
                  Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
