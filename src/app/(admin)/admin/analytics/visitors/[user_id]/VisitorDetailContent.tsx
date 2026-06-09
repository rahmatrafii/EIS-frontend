"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getEisScore } from "@/services/analytics.service";
import { useToast } from "@/stores/ToastContext";

// ==========================================
// TYPES & MOCK DATA
// ==========================================
interface VisitHistoryItem {
  date: string;
  timeRange?: string;
  grade: "S" | "A" | "B" | "C" | "D";
  score: number;
  exhibits: string[];
  knowledgePre: number;
  knowledgePost: number;
  retentionH7Status: "COMPLETED" | "PENDING" | "EXPIRED";
  retentionH7Score?: number;
  retentionH30Status: "COMPLETED" | "PENDING" | "EXPIRED";
  retentionH30Score?: number;
}

interface VisitorDetailData {
  id: string;
  name: string;
  email: string;
  initials: string;
  category: "CHILD" | "TEEN" | "ADULT";
  age: number;
  joinDate: string;
  totalVisits: number;
  overallEisGrade: "S" | "A" | "B" | "C" | "D";
  overallEisScore: number;
  latestCalculationDate: string;
  badgeName: string;
  badgeEmoji: string;
  // Radar data
  radarData: { subject: string; score: number; fullMark: number }[];
  // Score breakdown
  knowledgeScore: number;
  knowledgePre: number;
  knowledgePost: number;
  engagementScore: number;
  engagementMinutes: number;
  engagementExhibitsCount: number;
  engagementFavMedia: string;
  retentionScore: number;
  retentionH7: number;
  retentionH30: number;
  calculationFormula: string;
  // Visit history
  history: VisitHistoryItem[];
  // Progression chart data
  progressionData: { date: string; score: number }[];
}

// Helper to calculate score for each visit session
const calculateSessionScore = (session: any) => {
  // 1. Knowledge Gain
  const preScore = session.quizAttempts?.find((q: any) => q.quiz?.quizType === "PRE_ZOO")?.finalScore ?? 0;
  const postScore = session.quizAttempts?.find((q: any) => q.quiz?.quizType === "POST_ZOO")?.finalScore ?? 0;
  const knowledgeGain = Math.max(0, postScore - preScore);

  // 2. Engagement
  const duration = session.interactions?.reduce((sum: number, i: any) => sum + (i.durationSeconds || 0), 0) ?? 0;
  const exhibitsVisited = new Set(session.interactions?.map((i: any) => i.exhibitId)).size;
  
  let mediaClickedCount = 0;
  let hasLab = false;
  session.interactions?.forEach((i: any) => {
    if (i.clickedAudio) mediaClickedCount++;
    if (i.clickedVideo) mediaClickedCount++;
    if (i.clickedVisual) mediaClickedCount++;
    if (i.clickedInteractive) {
      mediaClickedCount++;
      hasLab = true;
    }
  });
  
  const durationPoints = Math.min(50, Math.floor(duration / 300));
  const exhibitPoints = Math.min(20, exhibitsVisited * 2);
  const mediaPoints = Math.min(20, mediaClickedCount * 5);
  const labBonus = hasLab ? 10 : 0;
  const engagementScore = Math.min(100, durationPoints + exhibitPoints + mediaPoints + labBonus);

  // 3. Retention
  const score1w = session.quizAttempts?.find((q: any) => q.quiz?.quizType === "RETENTION_1W")?.finalScore ?? null;
  const score1m = session.quizAttempts?.find((q: any) => q.quiz?.quizType === "RETENTION_1M")?.finalScore ?? null;
  
  let retentionScore = 0;
  if (score1w !== null && score1m !== null) {
    retentionScore = Math.round((score1w + score1m) / 2);
  } else if (score1w !== null) {
    retentionScore = Math.round(score1w * 0.5);
  }

  // Final EIS
  const finalEis = Math.round((knowledgeGain * 0.40) + (engagementScore * 0.35) + (retentionScore * 0.25));
  return {
    preScore,
    postScore,
    knowledgeGain,
    engagementScore,
    retentionScore,
    finalEis,
    duration,
    exhibitsVisited,
    score1w,
    score1m
  };
};

const mapMediaName = (media: string | null) => {
  if (!media) return "-";
  if (media === "INTERACTIVE_LAB") return "Interactive Lab";
  if (media === "VIDEO") return "Video";
  if (media === "AUDIO") return "Audio";
  if (media === "IMAGE_INFOGRAPHIC") return "Infographic";
  return media;
};

interface VisitorDetailContentProps {
  userId: string;
}

export default function VisitorDetailContent({ userId }: VisitorDetailContentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [visitorData, setVisitorData] = useState<VisitorDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getEisScore(userId);
        if (!result.success) {
          setError(result.error.message || "Gagal memuat data skor EIS.");
          toast.error(result.error.message || "Gagal memuat data skor EIS.");
          return;
        }

        const backendData = result.data as any;
        const user = backendData.user;

        if (!user) {
          setError("Data profil pengunjung tidak ditemukan.");
          toast.error("Data profil pengunjung tidak ditemukan.");
          return;
        }

        const initials = user.name
          ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
          : "U";

        const joinDate = user.registeredAt
          ? new Date(user.registeredAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
          : "-";

        const latestCalculationDate = backendData.calculatedAt
          ? new Date(backendData.calculatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
          : "-";

        const sessions = user.visitSessions || [];
        
        const history = sessions.map((session: any) => {
          const computed = calculateSessionScore(session);
          const formattedDate = new Date(session.visitDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });
          
          let timeRange = undefined;
          if (session.checkInAt) {
            const checkIn = new Date(session.checkInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            const checkOut = session.checkOutAt 
              ? new Date(session.checkOutAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
              : null;
            timeRange = checkOut ? `${checkIn} - ${checkOut}` : `${checkIn} - Sekarang`;
          }

          const exhibits = Array.from(new Set(session.interactions?.map((i: any) => i.exhibit?.name || "Kandang"))).filter(Boolean) as string[];

          const r7 = session.retentionSchedules?.find((r: any) => r.quizType === "RETENTION_1W");
          const r30 = session.retentionSchedules?.find((r: any) => r.quizType === "RETENTION_1M");

          const getGrade = (score: number) => {
            if (score >= 90) return "S";
            if (score >= 75) return "A";
            if (score >= 60) return "B";
            if (score >= 45) return "C";
            return "D";
          };

          return {
            date: formattedDate,
            timeRange,
            grade: getGrade(computed.finalEis),
            score: computed.finalEis,
            exhibits: exhibits.length > 0 ? exhibits : ["Belum ada kandang dikunjungi"],
            knowledgePre: computed.preScore,
            knowledgePost: computed.postScore,
            retentionH7Status: r7?.status || "PENDING",
            retentionH7Score: computed.score1w ?? undefined,
            retentionH30Status: r30?.status || "PENDING",
            retentionH30Score: computed.score1m ?? undefined,
          };
        });

        const sortedSessions = [...sessions].sort(
          (a: any, b: any) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
        );
        const progressionData = sortedSessions.map((session: any) => {
          const computed = calculateSessionScore(session);
          const formattedDate = new Date(session.visitDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short"
          });
          return {
            date: formattedDate,
            score: computed.finalEis
          };
        });

        const mappedData: VisitorDetailData = {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          initials,
          category: user.ageCategory,
          age: user.age,
          joinDate,
          totalVisits: sessions.length,
          overallEisGrade: backendData.grade,
          overallEisScore: backendData.finalEisScore,
          latestCalculationDate,
          badgeName: backendData.badge,
          badgeEmoji: backendData.grade === "S" ? "👑" : "🏆",
          radarData: [
            { subject: "Knowledge Gain", score: backendData.knowledgeGainScore, fullMark: 100 },
            { subject: "Engagement", score: backendData.engagementScore, fullMark: 100 },
            { subject: "Retention", score: backendData.retentionScore, fullMark: 100 },
          ],
          knowledgeScore: backendData.knowledgeGainScore,
          knowledgePre: backendData.preZooScore,
          knowledgePost: backendData.postZooScore,
          engagementScore: backendData.engagementScore,
          engagementMinutes: Math.round(backendData.totalDurationSeconds / 60),
          engagementExhibitsCount: backendData.totalExhibitsVisited,
          engagementFavMedia: mapMediaName(backendData.favoriteMedia),
          retentionScore: backendData.retentionScore,
          retentionH7: backendData.retention1wScore ?? 0,
          retentionH30: backendData.retention1mScore ?? 0,
          calculationFormula: `(${backendData.knowledgeGainScore} × 40%) + (${backendData.engagementScore} × 35%) + (${backendData.retentionScore} × 25%) = ${backendData.finalEisScore}`,
          history,
          progressionData: progressionData.length > 0 ? progressionData : [{ date: joinDate, score: 0 }]
        };

        setVisitorData(mappedData);
      } catch (err: any) {
        console.error("Error fetching visitor detail data:", err);
        setError("Terjadi kesalahan koneksi sistem.");
        toast.error("Terjadi kesalahan koneksi sistem.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, toast]);

  // Helper colors mapping
  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    S: { bg: "bg-amber-500/10", text: "text-amber-800", border: "border-amber-500/25" },
    A: { bg: "bg-emerald-500/10", text: "text-emerald-800", border: "border-emerald-500/25" },
    B: { bg: "bg-blue-500/10", text: "text-blue-800", border: "border-blue-500/25" },
    C: { bg: "bg-orange-500/10", text: "text-orange-800", border: "border-orange-500/25" },
    D: { bg: "bg-red-500/10", text: "text-red-800", border: "border-red-500/25" },
  };

  const getGradeBadge = (grade: "S" | "A" | "B" | "C" | "D") => {
    const config = gradeColors[grade] || gradeColors.A;
    return (
      <span className={cn("px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold border", config.bg, config.text, config.border)}>
        Grade {grade}
      </span>
    );
  };

  const getAgeCategoryBadge = (cat: string) => {
    let emoji = "🧑";
    let label = cat;
    let badgeClass = "bg-surface-container border border-outline-variant/50 text-on-surface-variant";

    switch (cat.toUpperCase()) {
      case "CHILD":
        emoji = "👦";
        label = "Anak-anak";
        badgeClass = "bg-pink-500/10 text-pink-700 border border-pink-200/30";
        break;
      case "TEEN":
        emoji = "🧑";
        label = "Remaja";
        badgeClass = "bg-indigo-500/10 text-indigo-700 border border-indigo-200/30";
        break;
      case "ADULT":
        emoji = "🧑";
        label = "Dewasa";
        badgeClass = "bg-teal-500/10 text-teal-700 border border-teal-200/30";
        break;
    }

    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border", badgeClass)}>
        <span className="text-[13px] leading-none select-none">{emoji}</span>
        <span>{label}</span>
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs font-sans space-y-1 backdrop-blur-sm">
          <p className="font-semibold text-slate-300">{label}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-slate-400">EIS Score:</span>
            <span className="font-bold text-white text-sm">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Breadcrumbs Skeleton */}
        <div className="h-5 bg-slate-200 rounded-md w-1/4" />
        
        {/* Profile Card Skeleton */}
        <div className="rounded-2xl p-6 border bg-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 w-full">
            <div className="w-[72px] h-[72px] rounded-xl bg-slate-200 shrink-0" />
            <div className="space-y-2 w-1/2">
              <div className="h-7 bg-slate-200 rounded-md w-3/4" />
              <div className="h-4 bg-slate-200 rounded-md w-1/2" />
            </div>
          </div>
          <div className="h-[80px] w-[180px] bg-slate-200 rounded-xl shrink-0" />
        </div>

        {/* Grid Columns Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-[320px] bg-white rounded-2xl border p-6 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-12 bg-slate-200 rounded w-full" />
            <div className="h-12 bg-slate-200 rounded w-full" />
          </div>
          <div className="lg:col-span-2 h-[320px] bg-white rounded-2xl border p-6 flex flex-col justify-between">
            <div className="h-6 bg-slate-200 rounded w-1/2" />
            <div className="h-[200px] w-full bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !visitorData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-1 font-label-sm text-label-sm" style={{ color: "var(--color-on-surface-variant)" }}>
          <Link href={ROUTES.admin.analyticsVisitors} className="hover:text-primary transition-colors font-semibold">
            Analytics
          </Link>
          <span className="material-symbols-outlined text-outline/50 select-none text-[14px]">chevron_right</span>
          <span className="font-bold text-on-surface">Visitors Detail Error</span>
        </div>
        <div
          className="rounded-3xl p-8 border text-center space-y-4"
          style={{
            backgroundColor: "var(--color-surface-container-lowest)",
            borderColor: "rgba(189,201,193,0.3)",
          }}
        >
          <span className="material-symbols-outlined text-red-500 text-[64px] select-none">error</span>
          <h3 className="font-headline-md text-headline-md font-bold" style={{ color: "var(--color-on-surface)" }}>Gagal Memuat Detail Pengunjung</h3>
          <p className="text-body-sm text-outline/80">
            {error || "Pengunjung tidak ditemukan atau Anda tidak memiliki hak akses."}
          </p>
          <div className="pt-2">
            <Link
              href={ROUTES.admin.analyticsVisitors}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-primary hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] select-none">arrow_back</span> Kembali ke Daftar Pengunjung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const data = visitorData;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex font-label-sm text-label-sm"
        style={{ color: "var(--color-on-surface-variant)" }}
      >
        <ol className="inline-flex items-center gap-2">
          <li className="inline-flex items-center">
            <Link href={ROUTES.admin.dashboard} className="hover:text-primary transition-colors font-semibold">
              ZooLogix Admin
            </Link>
          </li>
          <li>
            <span className="material-symbols-outlined text-outline/50 select-none text-[14px]">chevron_right</span>
          </li>
          <li className="inline-flex items-center">
            <Link href={ROUTES.admin.analyticsVisitors} className="hover:text-primary transition-colors font-semibold">
              Analytics Pengunjung
            </Link>
          </li>
          <li>
            <span className="material-symbols-outlined text-outline/50 select-none text-[14px]">chevron_right</span>
          </li>
          <li aria-current="page">
            <span className="font-bold" style={{ color: "var(--color-primary)" }}>
              {data.name}
            </span>
          </li>
        </ol>
      </nav>

      {/* Visitor Profile Header */}
      <section
        className="rounded-2xl p-6 border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-surface-container-lowest"
        style={{
          borderColor: "rgba(189,201,193,0.3)",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div className="flex items-center gap-6">
          <div
            className="w-[72px] h-[72px] rounded-xl flex items-center justify-center font-headline-md text-headline-md font-bold shrink-0 border border-primary/10 bg-primary/[0.06] text-primary"
          >
            {data.initials}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h2
                className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface"
              >
                {data.name}
              </h2>
              {getAgeCategoryBadge(data.category)}
            </div>
            <div
              className="font-body-sm text-body-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-outline/80"
            >
              <span className="flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[16px] select-none text-primary">mail</span> {data.email}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span>Terdaftar: {data.joinDate}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span>Kunjungan: {data.totalVisits} Kali</span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span>Usia: {data.age} Tahun</span>
            </div>
          </div>
        </div>

        {/* Overall EIS Indicator */}
        <div
          className="flex items-center gap-4 p-4 rounded-xl border shrink-0 bg-surface-container-lowest"
          style={{
            borderColor: "rgba(189,201,193,0.35)",
            boxShadow: "0_2px_8px_rgba(0,0,0,0.01)"
          }}
        >
          <div className="text-right">
            <div
              className="font-label-sm text-label-sm font-semibold uppercase tracking-wider mb-1 text-on-surface-variant"
            >
              Kategori EIS
            </div>
            <div
              className="font-headline-md text-headline-md font-extrabold text-primary"
            >
              Grade {data.overallEisGrade}
            </div>
          </div>
          <div
            className="w-[80px] h-[80px] rounded-full border-4 bg-white flex items-center justify-center font-headline-xl text-headline-xl text-primary shrink-0 relative shadow-[0_0_15px_rgba(0,93,66,0.08)] font-extrabold"
            style={{
              borderColor: "var(--color-primary)",
              color: "var(--color-primary)",
            }}
          >
            {data.overallEisScore}
            <div
              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-sm"
              style={{
                backgroundColor: "var(--color-primary-container)",
                color: "var(--color-on-primary-container)",
                borderColor: "var(--color-surface-container-lowest)",
              }}
            >
              <span className="material-symbols-outlined text-[14px] select-none">star</span>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Layout: EIS Breakdown & Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* EIS Score Breakdown (60% -> lg:col-span-3) */}
        <section
          className="rounded-2xl p-6 border flex flex-col justify-between lg:col-span-3 bg-surface-container-lowest"
          style={{
            borderColor: "rgba(189,201,193,0.3)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3
                  className="font-headline-sm text-headline-sm font-bold text-on-surface"
                >
                  Skor EIS Terakhir
                </h3>
                <p
                  className="font-body-sm text-body-sm mt-1 text-outline/80"
                >
                  Kalkulasi Terakhir: {data.latestCalculationDate}
                </p>
              </div>
              <div
                className="px-3 py-1.5 rounded-xl border font-label-md text-label-md font-bold flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(0,93,62,0.05)",
                  color: "var(--color-tertiary)",
                  borderColor: "rgba(0,93,62,0.15)",
                }}
              >
                <span className="text-lg leading-none select-none">{data.badgeEmoji}</span> {data.badgeName}
              </div>
            </div>

            <div className="space-y-6">
              {/* Knowledge Gain */}
              <div>
                <div className="flex justify-between font-label-md text-label-md mb-2">
                  <span className="font-semibold text-on-surface">Knowledge Gain (40%)</span>
                  <span className="font-bold text-primary">
                    {data.knowledgeScore}/100
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full overflow-hidden mb-2 bg-surface-container"
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${data.knowledgeScore}%`,
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                </div>
                <p
                  className="font-body-sm text-body-sm text-outline/80"
                >
                  Kuis Awal: {data.knowledgePre} → Kuis Akhir: {data.knowledgePost} (Peningkatan: +{data.knowledgePost - data.knowledgePre})
                </p>
              </div>

              {/* Engagement */}
              <div>
                <div className="flex justify-between font-label-md text-label-md mb-2">
                  <span className="font-semibold text-on-surface">Engagement (35%)</span>
                  <span className="font-bold text-secondary">
                    {data.engagementScore}/100
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full overflow-hidden mb-2 bg-surface-container"
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${data.engagementScore}%`,
                      backgroundColor: "var(--color-secondary)",
                    }}
                  />
                </div>
                <p
                  className="font-body-sm text-body-sm text-outline/80"
                >
                  {data.engagementMinutes} Menit, {data.engagementExhibitsCount} Kandang dikunjungi, Media Teraktif: {data.engagementFavMedia}
                </p>
              </div>

              {/* Retention */}
              <div>
                <div className="flex justify-between font-label-md text-label-md mb-2">
                  <span className="font-semibold text-on-surface">Retention (25%)</span>
                  <span className="font-bold text-tertiary">
                    {data.retentionScore}/100
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full overflow-hidden mb-2 bg-surface-container"
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${data.retentionScore}%`,
                      backgroundColor: "var(--color-tertiary)",
                    }}
                  />
                </div>
                <p
                  className="font-body-sm text-body-sm text-outline/80"
                >
                  Evaluasi H+7: {data.retentionH7} / 100, Evaluasi H+30: {data.retentionH30} / 100
                </p>
              </div>
            </div>
          </div>

          <div
            className="mt-6 p-3.5 rounded-xl font-label-sm text-label-sm border font-mono bg-surface-container-low text-on-surface-variant/95"
            style={{
              borderColor: "rgba(189,201,193,0.25)",
            }}
          >
            Rumus Kalkulasi: {data.calculationFormula}
          </div>
        </section>

        {/* Statistics Summary (40% -> lg:col-span-2) */}
        <section
          className="rounded-2xl p-6 border flex flex-col lg:col-span-2 bg-surface-container-lowest"
          style={{
            borderColor: "rgba(189,201,193,0.3)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
          }}
        >
          <h3
            className="font-headline-sm text-headline-sm font-bold text-on-surface mb-6"
          >
            Radar Kinerja
          </h3>

          <div className="flex-1 w-full h-[250px] relative flex items-center justify-center">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radarData}>
                  <PolarGrid stroke="#bdc9c1" strokeWidth={1} opacity={0.5} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: "#3e4943",
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "var(--font-work-sans), sans-serif",
                    }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name={data.name}
                    dataKey="score"
                    stroke="#005d42"
                    fill="#005d42"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-container animate-pulse rounded-xl" />
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl border border-primary/10" style={{ backgroundColor: "rgba(4,120,87,0.03)" }}>
              <div className="font-headline-md text-[20px] font-extrabold text-primary">
                {data.knowledgeScore}
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-wider mt-1 text-on-surface-variant"
              >
                Knowledge
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-secondary/10" style={{ backgroundColor: "rgba(43,105,84,0.03)" }}>
              <div className="font-headline-md text-[20px] font-extrabold text-secondary">
                {data.engagementScore}
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-wider mt-1 text-on-surface-variant"
              >
                Engagement
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-tertiary/10" style={{ backgroundColor: "rgba(0,93,62,0.03)" }}>
              <div className="font-headline-md text-[20px] font-extrabold text-tertiary">
                {data.retentionScore}
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-wider mt-1 text-on-surface-variant"
              >
                Retention
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Lower Section: Timeline & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visit History Timeline */}
        <section
          className="rounded-2xl p-6 border bg-surface-container-lowest"
          style={{
            borderColor: "rgba(189,201,193,0.3)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3
              className="font-headline-sm text-headline-sm font-bold text-on-surface"
            >
              Riwayat Kunjungan
            </h3>
            {data.history.length > 3 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="hover:opacity-85 font-semibold text-xs transition-colors flex items-center gap-1 text-primary cursor-pointer"
              >
                {showAllHistory ? "Tampilkan Sedikit" : "Lihat Semua"}{" "}
                <span className="material-symbols-outlined text-[16px] select-none">
                  {showAllHistory ? "keyboard_arrow_up" : "arrow_forward"}
                </span>
              </button>
            )}
          </div>

          <div className="relative border-l-2 ml-3 space-y-8 pb-2 border-outline-variant/30">
            {(showAllHistory ? data.history : data.history.slice(0, 3)).map((visit, index) => {
              const isFirst = index === 0;
              return (
                <div key={visit.date} className="relative pl-6">
                  {/* Point marker */}
                  <div
                    className={cn(
                      "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 transition-all",
                      isFirst ? "bg-primary border-white shadow-sm scale-110" : "bg-outline-variant border-white"
                    )}
                  />

                  <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                    <div>
                      <h4
                        className="font-label-md text-label-md font-bold text-on-surface"
                      >
                        {visit.date}
                      </h4>
                      {visit.timeRange && (
                        <div
                          className="font-body-sm text-body-sm mt-0.5 text-outline"
                        >
                          {visit.timeRange}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getGradeBadge(visit.grade)}
                      <span
                        className="px-2.5 py-0.5 rounded-full font-semibold text-xs border border-outline-variant/30 bg-surface-container text-on-surface"
                      >
                        Score: {visit.score}
                      </span>
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-xl space-y-3 border bg-surface-container-low/30 border-outline-variant/20"
                  >
                    <p className="font-body-sm text-body-sm text-on-surface">
                      <span className="font-semibold text-on-surface-variant">Kandang dikunjungi:</span> {visit.exhibits.join(", ")}
                    </p>
                    <p
                      className="font-body-sm text-body-sm text-outline/90"
                    >
                      Kuis Pengetahuan: Pre: {visit.knowledgePre} → Post: {visit.knowledgePost} (Peningkatan: +{visit.knowledgePost - visit.knowledgePre})
                    </p>

                    <div className="flex gap-2 flex-wrap pt-1">
                      {/* H+7 status */}
                      {visit.retentionH7Status === "COMPLETED" && (
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 font-semibold text-xs rounded-xl flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] select-none font-bold">check_circle</span>
                          H+7 Selesai ({visit.retentionH7Score})
                        </span>
                      )}
                      {visit.retentionH7Status === "PENDING" && (
                        <span className="px-2.5 py-1 bg-outline-variant/15 border border-outline-variant/25 text-outline font-semibold text-xs rounded-xl flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] select-none">pending</span>
                          H+7 Menunggu
                        </span>
                      )}
                      {visit.retentionH7Status === "EXPIRED" && (
                        <span className="px-2.5 py-1 bg-error/10 border border-error/25 text-error font-semibold text-xs rounded-xl flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] select-none">cancel</span>
                          Retensi: Kadaluwarsa
                        </span>
                      )}

                      {/* H+30 status */}
                      {visit.retentionH7Status !== "EXPIRED" && visit.retentionH30Status === "COMPLETED" && (
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 font-semibold text-xs rounded-xl flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] select-none font-bold">check_circle</span>
                          H+30 Selesai ({visit.retentionH30Score})
                        </span>
                      )}
                      {visit.retentionH7Status !== "EXPIRED" && visit.retentionH30Status === "PENDING" && (
                        <span className="px-2.5 py-1 bg-outline-variant/15 border border-outline-variant/25 text-outline font-semibold text-xs rounded-xl flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] select-none">pending</span>
                          H+30 Menunggu
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* EIS Score Progression Chart */}
        <section
          className="rounded-2xl p-6 border flex flex-col bg-surface-container-lowest"
          style={{
            borderColor: "rgba(189,201,193,0.3)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div className="mb-6">
            <h3
              className="font-headline-sm text-headline-sm font-bold text-on-surface"
            >
              Progres Skor EIS
            </h3>
            <p
              className="font-body-sm text-body-sm mt-1 text-outline/80"
            >
              Grafik riwayat performa antar kunjungan
            </p>
          </div>

          <div className="flex-1 w-full h-[300px] relative">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.progressionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="5 5"
                    vertical={false}
                    stroke="#bdc9c1"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#3e4943", fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#3e4943", fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#005d42"
                    strokeWidth={3}
                    dot={{ fill: "#005d42", stroke: "#ffffff", strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-surface-container animate-pulse rounded-xl" />
            )}
          </div>
        </section>
      </div>

      <div className="h-6" />
    </div>
  );
}
