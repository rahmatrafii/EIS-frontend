"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, Home, Loader2, RefreshCw, Brain, Sparkles, Activity, History } from "lucide-react";

import { getUserProfile } from "@/services/auth.service";
import { getEisScore } from "@/services/analytics.service";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import type { UserProfile } from "@/types/user.types";
import type { EisScore } from "@/types/analytics.types";

export function ScoreContent() {
  const router = useRouter();

  // State Management
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [eisScore, setEisScore] = useState<EisScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Count-up state untuk total skor
  const [animatedScore, setAnimatedScore] = useState(0);

  // Memuat data profil & skor EIS secara paralel
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setAnimatedScore(0);

    try {
      const profileRes = await getUserProfile();
      if (profileRes.success) {
        setProfile(profileRes.data);
        
        const scoreRes = await getEisScore(profileRes.data.id);
        if (scoreRes.success) {
          setEisScore(scoreRes.data);
        } else {
          setErrorMsg(scoreRes.error.message || "Gagal memuat data Educational Impact Score.");
        }
      } else {
        setErrorMsg(profileRes.error.message || "Gagal memuat profil pengguna.");
      }
    } catch (err) {
      console.error("Gagal memuat halaman EIS:", err);
      setErrorMsg("Koneksi internet bermasalah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Efek animasi count-up untuk total skor EIS
  useEffect(() => {
    if (!eisScore || isLoading) return;

    const target = eisScore.finalEisScore;
    if (target === 0) {
      setAnimatedScore(0);
      return;
    }

    const duration = 1500; // 1.5 detik
    const startTime = performance.now();

    let frameId: number;

    const updateScore = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutExpo
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.floor(easedProgress * target);

      setAnimatedScore(currentVal);

      if (progress < 1) {
        frameId = requestAnimationFrame(updateScore);
      }
    };

    frameId = requestAnimationFrame(updateScore);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [eisScore, isLoading]);

  // Gelar dan deskripsi lencana dinamis berdasarkan grade
  const gradeDetails = useMemo(() => {
    if (!eisScore) return { title: "Pemula Hijau", desc: "Mulai perjalanan petualanganmu hari ini!", color: "text-red-400" };
    const grade = eisScore.grade;

    switch (grade) {
      case "S":
        return {
          title: "Naturalis Master",
          desc: "Penguasaan ekosistem tingkat legendaris dan kontribusi luar biasa bagi perlindungan satwa.",
          color: "text-secondary-fixed",
        };
      case "A":
        return {
          title: "Penjelajah Konservasi",
          desc: "Penguasaan materi yang luar biasa dan dedikasi tinggi terhadap kelestarian alam.",
          color: "text-[#79db8d]",
        };
      case "B":
        return {
          title: "Pecinta Satwa",
          desc: "Ketertarikan tinggi pada ragam keanekaragaman hayati dan kepedulian lingkungan.",
          color: "text-yellow-400",
        };
      case "C":
        return {
          title: "Pengamat Fauna",
          desc: "Pemahaman yang baik tentang satwa liar. Teruslah bereksplorasi!",
          color: "text-orange-400",
        };
      case "D":
      default:
        return {
          title: "Pemula Hijau",
          desc: "Mulai langkah awalmu untuk lebih mengenal satwa-satwa luar biasa ini.",
          color: "text-red-400",
        };
    }
  }, [eisScore]);

  // Perhitungan presentase kenaikan Knowledge Gain
  const knowledgeGainPercent = useMemo(() => {
    if (!eisScore) return 0;
    const { preZooScore, postZooScore } = eisScore;
    if (preZooScore === 0) return postZooScore;
    return Math.max(0, Math.round(((postZooScore - preZooScore) / preZooScore) * 100));
  }, [eisScore]);

  // Navigasi penutupan halaman (X) kembali ke profil
  const handleClose = () => {
    router.push(ROUTES.profile);
  };

  // Navigasi CTA kembali ke beranda
  const handleGoHome = () => {
    router.push(ROUTES.home);
  };

  // Styling custom bintang dan efek menyala tebal
  const starFieldStyle = {
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
    backgroundSize: "24px 24px"
  };

  const glowScoreStyle = {
    textShadow: "0 0 20px rgba(121, 219, 141, 0.6)"
  };

  // State: Loading
  if (isLoading) {
    return <PageLoader text="Menghitung nilai rapor belajarmu..." minHeight="min-h-[60vh]" />;
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

  if (!eisScore) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-background p-6 min-h-[60vh]">
        <p className="font-inter text-sm text-on-surface-variant">Data skor EIS belum tersedia.</p>
      </div>
    );
  }

  const {
    preZooScore,
    postZooScore,
    knowledgeGainScore,
    totalDurationSeconds,
    totalExhibitsVisited,
    engagementScore,
    retention1wScore,
    retention1mScore,
    retentionScore,
    finalEisScore,
    grade,
    badge,
  } = eisScore;

  // Koordinasi posisi marker di atas skala grade
  // Nilai dibatasi aman 0% sampai 100%
  const markerPosition = Math.min(100, Math.max(0, finalEisScore));

  return (
    <div className="w-full min-h-screen bg-[#f7faf6] relative overflow-x-hidden pb-32 flex flex-col select-none">
      {/* Decorative Ambient Background Blobs */}
      <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
      <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

      {/* Header Close Absolute */}
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-edge-margin h-20 bg-transparent">
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 active:scale-90 transition-transform cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h1 className="font-plus-jakarta-sans text-[18px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-[#95f8a7] to-white drop-shadow-md select-none uppercase">
          Rapor Belajar
        </h1>
        <div className="w-10 h-10" />
      </header>

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-gray-900 via-[#003d1c] to-[#00652c] pt-28 pb-16 px-edge-margin rounded-b-[2.5rem] overflow-hidden flex flex-col items-center shadow-lg">
        {/* Star Field Effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={starFieldStyle}></div>
        
        {/* Glow Ambient within Hero */}
        <div aria-hidden="true" className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/15 blur-3xl -right-20 -top-20 z-0 pointer-events-none" />
        <div aria-hidden="true" className="absolute w-60 h-60 rounded-full bg-primary/25 blur-3xl -left-20 -bottom-20 z-0 pointer-events-none" />

        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center md:text-left">
            {/* Score Number Display */}
            <div className="flex flex-col items-center">
              <p className="text-secondary-fixed font-plus-jakarta-sans text-[10px] font-extrabold uppercase tracking-widest mb-2 opacity-85">
                Educational Impact Score
              </p>
              <div className="relative">
                <h1
                  className="font-plus-jakarta-sans text-[110px] md:text-[140px] font-black text-primary-fixed-dim leading-none transition-all duration-300 select-none"
                  style={glowScoreStyle}
                >
                  {animatedScore}
                </h1>
              </div>
            </div>

            {/* Badge & Grade Details */}
            <div className="flex flex-col items-center md:items-start max-w-sm">
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-sm shadow-inner w-full md:w-auto">
                <div className="w-16 h-16 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center font-plus-jakarta-sans font-black text-4xl shadow-lg border-4 border-white/20 select-none shrink-0">
                  {grade}
                </div>
                <div className="text-left">
                  <h2 className="font-plus-jakarta-sans text-lg md:text-xl font-black text-white flex items-center gap-1.5 leading-none">
                    🏆 {badge || gradeDetails.title}
                  </h2>
                  <p className="text-[#79db8d]/90 text-xs italic mt-1.5 leading-relaxed max-w-[240px]">
                    "{gradeDetails.desc}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Scale Progress & Marker */}
          <div className="w-full max-w-xl mt-12 relative px-2">
            <div className="h-2.5 w-full bg-white/25 rounded-full flex overflow-hidden p-[1px]">
              <div className="h-full w-1/5 bg-red-400/60 rounded-l-full"></div>
              <div className="h-full w-1/5 bg-orange-400/60"></div>
              <div className="h-full w-1/5 bg-yellow-400/60"></div>
              <div className="h-full w-1/5 bg-primary-fixed/60"></div>
              <div className="h-full w-1/5 bg-secondary-fixed/60 rounded-r-full"></div>
            </div>
            
            <div className="flex justify-between text-[11px] text-white/70 mt-2.5 font-extrabold uppercase tracking-widest px-1">
              <span>D</span>
              <span>C</span>
              <span>B</span>
              <span className="text-secondary-fixed">A</span>
              <span>S</span>
            </div>

            {/* Scale Marker */}
            <motion.div
              initial={{ left: "0%" }}
              animate={{ left: `${markerPosition}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute -top-3.5 transition-all ease-out"
              style={{ transform: "translateX(-50%)" }}
            >
              <div className="w-5 h-5 bg-white rounded-full border-2 border-primary shadow-[0_0_12px_rgba(255,255,255,1)] flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BREAKDOWN SECTION */}
      <main className="px-edge-margin -mt-8 relative z-20 w-full max-w-4xl mx-auto flex-grow pb-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          
          {/* Left Side: Score Breakdown (takes 3 of 5 cols on tablet) */}
          <div className="md:col-span-3 bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2.5rem] p-6 backdrop-blur-lg flex flex-col gap-6">
            <h3 className="font-plus-jakarta-sans text-[16px] font-black text-on-surface tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg font-bold">analytics</span>
              Rincian Skormu
            </h3>
            
            <div className="flex flex-col gap-5">
              {/* Knowledge Gain Component */}
              <div className="p-4 bg-white/60 border border-outline-variant/10 rounded-2xl shadow-xs hover:border-primary/20 hover:shadow-md transition-all duration-300 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-plus-jakarta-sans text-sm font-bold leading-none text-on-surface">Knowledge Gain</h4>
                      <span className="text-[10px] font-extrabold text-outline/80 uppercase tracking-wider block mt-1">Bobot 40%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-plus-jakarta-sans text-sm font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/10">
                      +{knowledgeGainPercent}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-on-surface-variant font-semibold px-1">
                  <span>Pre-Test: {preZooScore}</span>
                  <span>Post-Test: {postZooScore}</span>
                </div>
                
                <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/5">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${postZooScore}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-primary rounded-full"
                  ></motion.div>
                </div>
              </div>

              {/* Engagement Component */}
              <div className="p-4 bg-white/60 border border-outline-variant/10 rounded-2xl shadow-xs hover:border-blue-500/20 hover:shadow-md transition-all duration-300 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-plus-jakarta-sans text-sm font-bold leading-none text-on-surface">Engagement</h4>
                      <span className="text-[10px] font-extrabold text-outline/80 uppercase tracking-wider block mt-1">Bobot 35%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-plus-jakarta-sans text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      {engagementScore}/100
                    </span>
                  </div>
                </div>

                {/* Dynamic Action Badges */}
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-blue-50/50 border border-blue-100 text-[10px] font-bold text-blue-700 rounded-full">
                    ⏱️ {Math.floor(totalDurationSeconds / 60)} Mins Active
                  </div>
                  <div className="px-3 py-1 bg-blue-50/50 border border-blue-100 text-[10px] font-bold text-blue-700 rounded-full">
                    🐾 {totalExhibitsVisited} Exhibits Visited
                  </div>
                  <div className="px-3 py-1 bg-blue-50/50 border border-blue-100 text-[10px] font-bold text-blue-700 rounded-full">
                    🧪 Lab Interactive
                  </div>
                </div>

                <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/5">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${engagementScore}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                    className="h-full bg-blue-500 rounded-full"
                  ></motion.div>
                </div>
              </div>

              {/* Retention Component */}
              <div className="p-4 bg-white/60 border border-outline-variant/10 rounded-2xl shadow-xs hover:border-purple-500/20 hover:shadow-md transition-all duration-300 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0 border border-purple-100">
                      <History className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-plus-jakarta-sans text-sm font-bold leading-none text-on-surface">Retention</h4>
                      <span className="text-[10px] font-extrabold text-outline/80 uppercase tracking-wider block mt-1">Bobot 25%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-plus-jakarta-sans text-sm font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                      {retentionScore}/100
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-on-surface-variant font-semibold px-1">
                  <span>H+7 Recall: {retention1wScore !== null ? `${retention1wScore}/100` : "-"}</span>
                  <span>H+30 Recall: {retention1mScore !== null ? `${retention1mScore}/100` : "-"}</span>
                </div>

                <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden p-0.5 border border-outline-variant/5">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${retentionScore}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                    className={`h-full rounded-full ${retentionScore > 0 ? "bg-purple-500" : "bg-purple-300/40"}`}
                  ></motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Formula & Motivation Cards (takes 2 of 5 cols on tablet) */}
          <div className="md:col-span-2 flex flex-col gap-6 w-full">
            {/* Formula Card */}
            <div className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2.5rem] p-6 backdrop-blur-lg flex flex-col gap-4">
              <h3 className="font-plus-jakarta-sans text-[14px] font-black text-on-surface tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-md font-bold">calculate</span>
                Kalkulasi Final
              </h3>
              <div className="bg-surface-container-low/60 border border-outline-variant/10 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-[10px] font-extrabold text-outline/80 uppercase tracking-wider">Formula Rumus</p>
                <div className="flex flex-col gap-1">
                  <code className="text-xs font-mono text-on-surface-variant leading-relaxed break-words">
                    ({knowledgeGainScore} × 40%) + ({engagementScore} × 35%) + ({retentionScore} × 25%)
                  </code>
                </div>
                <div className="h-px bg-outline-variant/30 w-full my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface-variant">Hasil Akhir</span>
                  <span className="font-plus-jakarta-sans text-xl font-black text-primary">
                    = {finalEisScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Motivation Card */}
            <div className="bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent border border-primary/15 shadow-lg shadow-primary/[0.02] rounded-[2.5rem] p-6 relative overflow-hidden flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 text-xl border border-primary/10 shadow-xs">
                ✨
              </div>
              <div className="flex-1">
                <h4 className="font-plus-jakarta-sans text-sm font-black text-primary mb-1.5 uppercase tracking-wide">
                  {finalEisScore >= 80 ? "Fantastis!" : finalEisScore >= 60 ? "Bagus Sekali!" : "Kerja Bagus!"}
                </h4>
                <p className="font-inter text-xs text-on-surface-variant leading-relaxed font-medium">
                  {finalEisScore >= 80 
                    ? "Pengetahuanmu tentang satwa dan konservasi sudah sangat baik. Bagikan semangatmu kepada dunia!"
                    : "Kamu memiliki minat yang kuat dalam mempelajari satwa liar. Teruslah menjelajah dan belajar di ZOO!"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky CTA Bottom Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] md:max-w-[850px] lg:max-w-[960px] p-edge-margin bg-white/80 backdrop-blur-lg z-50 border-t border-outline-variant/30 flex justify-center">
          <button
            onClick={handleGoHome}
            className="w-full max-w-md bg-gradient-to-r from-primary to-[#005c24] text-white py-4 rounded-full font-plus-jakarta-sans font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-transform transition-all text-xs cursor-pointer"
          >
            <Home className="w-4 h-4 text-white" />
            Kembali ke Beranda
          </button>
        </div>
      </main>
    </div>
  );
}
