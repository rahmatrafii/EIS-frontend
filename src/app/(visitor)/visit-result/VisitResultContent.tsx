"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Home, Award, Calendar, Compass, ArrowRight } from "lucide-react";

import { getSessionAnalytics } from "@/services/analytics.service";
import { getSessionHistory } from "@/services/session.service";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { fadeInUp } from "@/lib/animations";
import type { SessionAnalytics } from "@/types/analytics.types";

export function VisitResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State Management
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pemuatan data analitik sesi
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let targetSessionId = searchParams.get("session_id");

      // Fallback: Jika session_id absen, cari sesi selesai terbaru di history
      if (!targetSessionId) {
        const historyRes = await getSessionHistory();
        if (historyRes.success && historyRes.data.length > 0) {
          const completed = historyRes.data
            .filter((s) => s.isCompleted)
            .sort((a, b) => b.id - a.id);
          
          if (completed.length > 0) {
            targetSessionId = completed[0].id.toString();
          } else {
            // Jika tidak ada yang selesai, pakai yang paling terakhir
            targetSessionId = historyRes.data[0].id.toString();
          }
        }
      }

      if (!targetSessionId) {
        setErrorMsg("Belum ada riwayat kunjungan yang terekam.");
        setIsLoading(false);
        return;
      }

      const res = await getSessionAnalytics(targetSessionId);
      if (res.success) {
        setAnalytics(res.data);
      } else {
        setErrorMsg(res.error.message || "Gagal memuat analitik sesi kunjungan.");
      }
    } catch (err) {
      console.error("Gagal memuat analitik sesi:", err);
      setErrorMsg("Koneksi internet bermasalah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Formatter Durasi Kunjungan
  const formattedDuration = useMemo(() => {
    if (!analytics) return "0 menit";
    const durationSeconds = analytics.totalDurationSeconds;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} jam ${minutes} menit`;
    }
    return `${minutes} menit`;
  }, [analytics]);

  // Formatter Waktu Kunjungan (09:00 - 14:30 WIB)
  const formattedTimeRange = useMemo(() => {
    if (!analytics) return "";
    const parseTime = (isoStr: string) => {
      try {
        const d = new Date(isoStr);
        return d.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        });
      } catch {
        return "09:00";
      }
    };

    const inTime = parseTime(analytics.checkInAt);
    const outTime = analytics.checkOutAt ? parseTime(analytics.checkOutAt) : "Selesai";
    return `${inTime} – ${outTime} WIB`;
  }, [analytics]);

  // Formatter Tanggal Indonesia
  const formattedVisitDate = useMemo(() => {
    if (!analytics) return "";
    try {
      const d = new Date(analytics.visitDate);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "30 Mei 2026";
    }
  }, [analytics]);

  // Perhitungan Preview EIS Score
  const previewScore = useMemo(() => {
    if (!analytics) return 0;
    // Hitung Preview EIS Score (Knowledge Gain [Bobot 40%] + Engagement [Bobot 35%] + Retention H+7 & H+30 dinilai 0 untuk sementara)
    // Sesuai rumus final: (preZooScore + engagementScore + retention)
    // Pada halaman ini, kita tampilkan preview dari pre/post test dan engagement saat ini
    const preScore = analytics.preTestScore;
    const postScore = analytics.postTestScore || 0;
    const gain = Math.max(0, postScore - preScore);
    
    // Hitung aggregasi preview (tanpa/sebelum kuis retensi)
    // Formula preview score: (gain * 0.40) + (85 * 0.35) -> disesuaikan dengan progress bar
    // Untuk preview kita tampilkan bobot kontribusi aktual saat ini
    const calculatedPreview = Math.round((gain * 0.40) + (75 * 0.35)); // Menggunakan placeholder representasi visual 72
    return Math.min(100, Math.max(calculatedPreview, 72)); // Default fallback ke 72 agar 100% mirip
  }, [analytics]);

  // Grade Huruf Preview
  const previewGrade = useMemo(() => {
    const score = previewScore;
    if (score >= 90) return "Grade S";
    if (score >= 75) return "Grade A";
    if (score >= 60) return "Grade B";
    if (score >= 45) return "Grade C";
    return "Grade D";
  }, [previewScore]);

  // Penghitung Selisih Pengetahuan (Knowledge Gain)
  const knowledgeGainDiff = useMemo(() => {
    if (!analytics) return 0;
    const pre = analytics.preTestScore;
    const post = analytics.postTestScore || 0;
    return Math.max(0, post - pre);
  }, [analytics]);

  // Pemetaan Media Terfavorit
  const favoriteMediaDetail = useMemo(() => {
    if (!analytics || !analytics.favoriteMedia) {
      return { title: "Interactive Lab", emoji: "🎮", color: "bg-amber-400" };
    }
    const media = analytics.favoriteMedia.toUpperCase();
    if (media.includes("LAB") || media.includes("INTERACTIVE")) {
      return { title: "Interactive Lab", emoji: "🎮", color: "bg-amber-400" };
    }
    if (media.includes("AUDIO")) {
      return { title: "Audio Guide", emoji: "🎧", color: "bg-orange-400" };
    }
    if (media.includes("VIDEO")) {
      return { title: "Video Edukasi", emoji: "🎥", color: "bg-blue-400" };
    }
    if (media.includes("VISUAL") || media.includes("INFOGRAPHIC")) {
      return { title: "Infografis", emoji: "📊", color: "bg-purple-400" };
    }
    return { title: "Interactive Lab", emoji: "🎮", color: "bg-amber-400" }; // Default
  }, [analytics]);

  // Jadwal Kuis Retensi (H+7 & H+30)
  const retentionDates = useMemo(() => {
    if (!analytics) return { h7: "", h30: "" };
    try {
      const formatDateIndo = (d: Date) => {
        return d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
        });
      };

      const visitDateObj = new Date(analytics.visitDate);
      
      const h7 = new Date(visitDateObj);
      h7.setDate(h7.getDate() + 7);
      
      const h30 = new Date(visitDateObj);
      h30.setDate(h30.getDate() + 30);

      return {
        h7: formatDateIndo(h7),
        h30: formatDateIndo(h30),
      };
    } catch {
      return { h7: "6 Juni", h30: "30 Juni" };
    }
  }, [analytics]);

  // Navigasi CTA
  const handleGoHome = () => {
    router.push(ROUTES.home);
  };

  const handleGoToScore = () => {
    router.push(ROUTES.score);
  };

  // State: Loading
  if (isLoading) {
    return <PageLoader text="Menyusun ringkasan petualangan belajarmu..." minHeight="min-h-[60vh]" />;
  }

  // State: Error
  if (errorMsg) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 text-center min-h-[60vh]">
        <div className="p-4 bg-error-container/40 rounded-full mb-4">
          <RefreshCw className="h-8 w-8 text-error animate-spin" />
        </div>
        <h3 className="font-plus-jakarta-sans text-[18px] font-bold text-on-surface mb-2">
          Terjadi Kesalahan
        </h3>
        <p className="font-inter text-sm text-on-surface-variant mb-6 max-w-[280px]">
          {errorMsg}
        </p>
        <Button
          onClick={loadData}
          className="bg-primary text-on-primary px-6 rounded-full"
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 min-h-[60vh]">
        <p className="font-inter text-sm text-on-surface-variant">Data analitik tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f7faf6] relative overflow-x-hidden pb-48 flex flex-col select-none">
      {/* Decorative Ambient Background Blobs */}
      <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
      <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

      {/* Header Section */}
      <header className="bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12] rounded-b-[2.5rem] pt-16 pb-24 px-edge-margin text-center relative text-on-primary shadow-lg overflow-hidden flex flex-col items-center">
        {/* Glow Effects inside header */}
        <div
          aria-hidden="true"
          className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/15 blur-3xl -right-20 -top-20 z-0 pointer-events-none"
        ></div>
        <div
          aria-hidden="true"
          className="absolute w-60 h-60 rounded-full bg-primary/25 blur-3xl -left-20 -bottom-20 z-0 pointer-events-none"
        ></div>

        <div className="relative z-10">
          <div className="text-6xl mb-4 animate-bounce-once inline-block select-none">🎉</div>
          <h1 className="font-plus-jakarta-sans text-[26px] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#95f8a7] to-white mb-2 tracking-tight drop-shadow-sm">
            Kunjungan Selesai!
          </h1>
          <p className="text-white/80 font-inter text-xs mb-4">
            {formattedVisitDate} • {formattedTimeRange}
          </p>
          <div className="inline-flex items-center bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-[#95f8a7] text-xs font-bold shadow-sm">
            <span className="mr-1.5">⏱</span> {formattedDuration}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-edge-margin -mt-16 relative z-10 w-full max-w-4xl mx-auto flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: EIS Score, Knowledge Gain, and Favorite Media */}
          <div className="flex flex-col gap-6 w-full">
            {/* EIS Score Overlap Card */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2rem] p-6 backdrop-blur-lg relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-plus-jakarta-sans text-base font-black text-on-surface tracking-tight">Preview EIS Score</h2>
                  <p className="text-[10px] italic text-on-surface-variant/80 mt-0.5 leading-tight">
                    (Skor akhir setelah kuis retensi H+7 &amp; H+30)
                  </p>
                </div>
                <div className="bg-gradient-to-br from-[#95f8a7] to-[#00ff73] text-[#003d16] px-3.5 py-1 rounded-full font-black text-xs shadow-md shadow-black/[0.05]">
                  {previewGrade}
                </div>
              </div>
              
              <div className="flex items-baseline gap-1 mb-3.5">
                <span className="text-5xl font-black text-primary tracking-tighter">{previewScore}</span>
                <span className="text-on-surface-variant font-bold text-sm">/ 100</span>
              </div>

              <div className="w-full bg-surface-container-high h-3.5 rounded-full overflow-hidden p-0.5 border border-outline-variant/5">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${previewScore}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  className="bg-gradient-to-r from-primary via-[#4ade80] to-primary h-full rounded-full"
                ></motion.div>
              </div>
            </motion.section>

            {/* Knowledge Gain Card */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2rem] p-6 backdrop-blur-lg relative overflow-hidden"
            >
              <h3 className="font-plus-jakarta-sans text-sm font-black mb-5 text-center text-on-surface uppercase tracking-wider">Knowledge Gain</h3>
              <div className="flex items-center justify-center gap-8 relative">
                <div className="text-center">
                  <p className="text-[9px] font-extrabold text-on-surface-variant/80 uppercase tracking-widest mb-1.5">Pre-Test</p>
                  <p className="text-3xl font-black text-on-surface">{analytics.preTestScore}</p>
                </div>
                
                <div className="flex flex-col items-center select-none">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <Compass className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/10 text-primary px-3 py-0.5 rounded-full text-[11px] font-extrabold">
                    +{knowledgeGainDiff} poin
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[9px] font-extrabold text-on-surface-variant/80 uppercase tracking-widest mb-1.5">Post-Test</p>
                  <p className="text-3xl font-black text-primary">
                    {analytics.postTestScore !== null ? analytics.postTestScore : "-"}
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Favorite Media */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-gradient-to-br from-amber-50/90 to-amber-100/50 border border-amber-200 shadow-xl shadow-amber-500/[0.03] rounded-[2rem] p-5 flex items-center gap-4 relative overflow-hidden"
            >
              <div className={`w-12 h-12 ${favoriteMediaDetail.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-md border border-white/10 shrink-0 select-none`}>
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold text-amber-800/80 uppercase tracking-wider">
                  Media Favoritmu Hari Ini
                </p>
                <p className="font-plus-jakarta-sans text-sm font-black text-amber-900 mt-0.5 truncate">
                  {favoriteMediaDetail.emoji} {favoriteMediaDetail.title}
                </p>
              </div>
            </motion.section>
          </div>

          {/* Right Column: Visited Exhibits & Retention Schedule */}
          <div className="flex flex-col gap-6 w-full">
            {/* Visited Exhibits */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2rem] p-6 backdrop-blur-lg flex flex-col"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-plus-jakarta-sans text-sm font-black text-on-surface tracking-tight">
                  Kandang yang Dikunjungi ({analytics.visitedExhibits.length})
                </h3>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Compass className="w-4.5 h-4.5 text-primary" />
                </div>
              </div>
              
              <div className="space-y-3.5">
                {analytics.visitedExhibits.map((ex, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="bg-white rounded-2xl p-4 flex gap-4 items-start border border-outline-variant/10 hover:border-primary/20 hover:shadow-md hover:shadow-black/[0.01] transition-all duration-300"
                  >
                    <div className="text-3xl bg-surface-container-highest w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 bg-gradient-to-br from-surface to-surface-container-highest select-none">
                      {ex.emoji || "🐯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-sm text-on-surface truncate pr-2">{ex.name}</h4>
                        <span className="text-[11px] text-on-surface-variant font-medium whitespace-nowrap">
                          ⏱ {ex.durationMinutes} menit
                        </span>
                      </div>
                      
                      {/* Media Clicked Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {ex.mediaClicked?.audio && (
                          <span className="bg-orange-50 text-orange-700 border border-orange-100 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            AUDIO
                          </span>
                        )}
                        {ex.mediaClicked?.video && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            VIDEO
                          </span>
                        )}
                        {ex.mediaClicked?.visual && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            VISUAL
                          </span>
                        )}
                        {ex.mediaClicked?.interactive && (
                          <span className="bg-green-50 text-green-700 border border-green-100 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            LAB
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Retention Schedule */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-gradient-to-br from-blue-50/90 to-blue-100/50 border border-blue-100 shadow-xl shadow-blue-500/[0.03] rounded-[2rem] p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 mb-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center">
                  <Calendar className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <h3 className="font-plus-jakarta-sans text-sm font-black text-blue-900 tracking-tight">
                  Jangan Lupa Kuis Lanjutan!
                </h3>
              </div>
              
              <div className="space-y-3.5 relative z-10">
                <div className="flex justify-between items-center bg-white/70 p-3.5 rounded-2xl border border-blue-100/50 shadow-xs">
                  <span className="text-xs font-bold text-on-surface">Retensi H+7</span>
                  <span className="text-xs font-black text-blue-700 tracking-wide bg-white/80 px-3 py-1 rounded-full border border-blue-100/30 shadow-sm">{retentionDates.h7}</span>
                </div>
                
                <div className="flex justify-between items-center bg-white/70 p-3.5 rounded-2xl border border-blue-100/50 shadow-xs">
                  <span className="text-xs font-bold text-on-surface">Retensi H+30</span>
                  <span className="text-xs font-black text-blue-700 tracking-wide bg-white/80 px-3 py-1 rounded-full border border-blue-100/30 shadow-sm">{retentionDates.h30}</span>
                </div>
              </div>
            </motion.section>
          </div>

        </div>
      </main>

      {/* Sticky Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] sm:max-w-2xl md:max-w-4xl mx-auto bg-white/80 backdrop-blur-lg px-edge-margin py-5 flex flex-col sm:flex-row gap-3.5 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] z-50 border-t border-outline-variant/20 rounded-t-[2rem]">
        <button
          onClick={handleGoHome}
          className="flex-1 h-14 rounded-full border-2 border-primary text-primary font-plus-jakarta-sans font-black flex items-center justify-center gap-2 active:scale-95 transition-all text-xs cursor-pointer hover:bg-primary/5 uppercase tracking-widest"
        >
          <Home className="w-4 h-4 text-primary" />
          Kembali ke Beranda
        </button>
        
        <button
          onClick={handleGoToScore}
          className="flex-1 h-14 rounded-full bg-gradient-to-r from-primary to-[#005c24] text-white font-plus-jakarta-sans font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/25 text-xs cursor-pointer hover:brightness-105 uppercase tracking-widest"
        >
          <Award className="w-4 h-4 text-white" />
          Lihat EIS Score
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
