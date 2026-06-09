// src/app/(visitor)/scan/ScanContent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Keyboard, CheckCircle2, CameraOff } from "lucide-react";

import { useQrScanner } from "@/hooks/useQrScanner";
import { useCheckin } from "@/hooks/useCheckin";
import { useToast } from "@/stores/ToastContext";
import { QrScanner } from "@/components/visitor/QrScanner";
import { PageTransition } from "@/components/layout/PageTransition";
import { ROUTES } from "@/constants/routes";
import { fadeInUp, fadeIn, scaleIn } from "@/lib/animations";

export function ScanContent() {
  const router = useNextRouter();
  const { toast } = useToast();
  const { checkin, isLoading: isCheckingIn, error: checkinError, setError: setCheckinError } = useCheckin();

  const [phase, setPhase] = useState<"scanning" | "manual" | "success" | "error">("scanning");
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [successExhibitName, setSuccessExhibitName] = useState("");

  const handleScanSuccess = useCallback(
    async (code: string) => {
      // 1. Triggers API checkin
      const result = await checkin(code);
      if (result) {
        // Save exhibit to sessionStorage
        sessionStorage.setItem("eis_current_exhibit", JSON.stringify(result.exhibit));
        sessionStorage.setItem("eis_current_interaction_id", String(result.interaction.id));
        if (result.learningContents) {
          sessionStorage.setItem("eis_current_learning_contents", JSON.stringify(result.learningContents));
        }
        if (result.media) {
          sessionStorage.setItem("eis_current_media", JSON.stringify(result.media));
        }
        setSuccessExhibitName(result.exhibit.name);
        setPhase("success");

        // 2. Immersive success feedback, redirect after 2s
        setTimeout(() => {
          router.push(ROUTES.exhibit.detail(result.exhibit.id.toString()));
        }, 2000);
      } else {
        // Exhibit not found or server error -> toast error and continue scanning
        toast.error("QR Code tidak dikenali atau kandang tidak ditemukan.");
        // Restart scanner
        startScanning();
      }
    },
    [checkin, router, toast]
  );

  const {
    videoRef,
    isScanning,
    permissionStatus,
    error: scannerError,
    startScanning,
    stopScanning,
  } = useQrScanner({
    onScanSuccess: handleScanSuccess,
    onScanError: () => {
      setPhase("error");
    },
  });

  // Handle auto transitioning to error phase if camera permission is denied
  useEffect(() => {
    if (permissionStatus === "denied") {
      setPhase("error");
    }
  }, [permissionStatus]);

  // Restarts scanner when switching back to scanning phase
  const handleSwitchToScanning = () => {
    setPhase("scanning");
    setCheckinError(null);
    setManualError(null);
    startScanning();
  };

  const handleSwitchToManual = () => {
    stopScanning();
    setPhase("manual");
    setManualError(null);
    setCheckinError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualCode(e.target.value);
    if (manualError) {
      setManualError(null);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const cleanCode = manualCode.trim().toUpperCase();
    if (!cleanCode) {
      setManualError("Kode tidak boleh kosong");
      return;
    }

    if (cleanCode.length < 3) {
      setManualError("Kode minimal 3 karakter");
      return;
    }

    const result = await checkin(cleanCode);
    if (result) {
      sessionStorage.setItem("eis_current_exhibit", JSON.stringify(result.exhibit));
      sessionStorage.setItem("eis_current_interaction_id", String(result.interaction.id));
      if (result.learningContents) {
        sessionStorage.setItem("eis_current_learning_contents", JSON.stringify(result.learningContents));
      }
      if (result.media) {
        sessionStorage.setItem("eis_current_media", JSON.stringify(result.media));
      }
      setSuccessExhibitName(result.exhibit.name);
      setPhase("success");

      setTimeout(() => {
        router.push(ROUTES.exhibit.detail(result.exhibit.id.toString()));
      }, 2000);
    } else {
      setManualError(checkinError || "Kode kandang tidak valid atau tidak ditemukan.");
    }
  };

  return (
    <PageTransition className="w-full h-full min-h-screen bg-[#f7faf6] text-on-surface relative flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {/* PHASE 1: SCANNING */}
        {phase === "scanning" && (
          <motion.div
            key="scanning"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeIn}
            className="w-full h-full absolute inset-0 bg-black text-white flex flex-col z-10"
          >
            {/* TopAppBar Transparent Glass Overlay */}
            <header className="w-full shrink-0 flex justify-between items-center px-edge-margin h-16 z-50 bg-black/40 backdrop-blur-md border-b border-white/5">
              <button
                onClick={() => router.push(ROUTES.home)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/50 active:scale-90 transition-transform cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <h1 className="font-plus-jakarta-sans text-lg font-black text-white tracking-tight leading-none uppercase">
                Scan QR Kandang
              </h1>
              <div className="w-10"></div> {/* Spacer */}
            </header>

            {/* Camera Viewport Area */}
            <QrScanner videoRef={videoRef} isScanning={isScanning} />

            {/* Bottom Controls Overlay */}
            <div className="bg-black/60 backdrop-blur-xl p-edge-margin pb-[40px] flex flex-col items-center gap-6 z-50 rounded-t-[2.5rem] border-t border-white/10 mt-auto shadow-2xl">
              {/* Little drag indicator bar to make it feel premium */}
              <div className="w-12 h-1 bg-white/20 rounded-full mb-1"></div>
              <p className="text-white/80 text-center font-inter text-xs max-w-[280px] leading-relaxed">
                Arahkan kamera ke QR Code yang ada di depan kandang satwa.
              </p>
              <button
                onClick={handleSwitchToManual}
                className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-full text-white font-plus-jakarta-sans text-sm font-black tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all shadow-lg shadow-black/20"
              >
                <Keyboard className="w-4 h-4 text-white" />
                Input Kode Manual
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: MANUAL ENTRY */}
        {phase === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="w-full h-full absolute inset-0 bg-[#f7faf6] text-on-surface z-20 flex flex-col overflow-y-auto select-none"
          >
            {/* Ambient Background Blobs */}
            <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
            <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

            {/* Header: Rounded Gradient Header */}
            <header className="bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12] rounded-b-[2.5rem] px-edge-margin pt-[50px] pb-8 relative text-on-primary shadow-lg overflow-hidden flex flex-col items-center shrink-0">
              {/* Glow Effects */}
              <div aria-hidden="true" className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/15 blur-3xl -right-20 -top-20 z-0 pointer-events-none" />
              <div aria-hidden="true" className="absolute w-60 h-60 rounded-full bg-primary/25 blur-3xl -left-20 -bottom-20 z-0 pointer-events-none" />

              <div className="absolute top-[16px] left-4 flex items-center z-20">
                <button
                  onClick={handleSwitchToScanning}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 active:scale-90 transition-transform cursor-pointer"
                  aria-label="Kembali ke Scan"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                </button>
              </div>
              <h1 className="font-plus-jakarta-sans text-[18px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-[#95f8a7] to-white drop-shadow-md select-none uppercase">
                ZOO
              </h1>
            </header>

            {/* Input Form Body */}
            <div className="flex-1 pt-8 px-edge-margin flex flex-col justify-start relative z-10 -mt-6">
              <form
                onSubmit={handleManualSearch}
                className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2.5rem] p-7 backdrop-blur-lg flex flex-col gap-6"
              >
                <div className="flex items-center gap-3.5">
                  <div className="bg-primary/10 w-11 h-11 rounded-2xl flex items-center justify-center text-primary border border-primary/5 shadow-inner">
                    <Keyboard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-plus-jakarta-sans text-[17px] font-black text-on-surface leading-none">
                      Masukkan Kode QR
                    </h2>
                    <span className="font-plus-jakarta-sans text-[10px] font-extrabold uppercase tracking-wider text-outline/80 mt-1 block">
                      Kode Unik Kandang
                    </span>
                  </div>
                </div>
                
                <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
                  Temukan kode unik di papan informasi satwa yang terletak di bawah QR Code kandang.
                </p>

                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    id="manual-input"
                    maxLength={100}
                    placeholder="CONTOH: EXH-GAJAH-A3F9X"
                    value={manualCode}
                    onChange={handleInputChange}
                    className="w-full bg-surface-container/60 border border-outline-variant/20 focus:border-primary focus:ring-4 focus:ring-primary/10 text-center font-plus-jakarta-sans text-lg font-black uppercase tracking-widest py-4 px-4 rounded-2xl transition-all outline-none text-on-surface placeholder:text-on-surface-variant/40"
                    autoFocus
                  />
                  {manualError && (
                    <p className="text-error font-inter text-[11px] text-center mt-1 font-semibold">
                      ⚠️ {manualError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isCheckingIn}
                  className="w-full bg-gradient-to-r from-primary to-[#005c24] text-white py-4 rounded-full font-plus-jakarta-sans text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCheckingIn ? (
                    <>
                      <span>Mencari...</span>
                    </>
                  ) : (
                    <>
                      <span>Cari Kandang</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* PHASE 3: SUCCESS OVERLAY */}
        {phase === "success" && (
          <motion.div
            key="success"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeIn}
            className="w-full h-full absolute inset-0 bg-black/75 backdrop-blur-xl z-50 flex flex-col justify-center items-center px-edge-margin"
          >
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center text-center max-w-[280px]"
            >
              {/* Success Badge */}
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-[#005c24] rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(0,101,44,0.6)] border border-primary-fixed/20 relative">
                {/* Glow ring */}
                <div className="absolute inset-[-4px] rounded-[2.2rem] border-2 border-primary/30 animate-pulse pointer-events-none"></div>
                <CheckCircle2
                  className="text-white w-12 h-12 stroke-[2]"
                />
              </div>

              {/* Satwa Name */}
              <h2 className="font-plus-jakarta-sans text-2xl font-black text-white mb-2 tracking-tight leading-tight uppercase drop-shadow-md">
                {successExhibitName}
              </h2>

              <p className="font-inter text-xs text-white/80 tracking-wide font-medium">
                Membuka halaman edukasi...
              </p>

              {/* Dynamic bouncing dots loader */}
              <div className="mt-8 flex gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full bg-[#95f8a7] animate-bounce shadow-sm"
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full bg-[#95f8a7] animate-bounce shadow-sm"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full bg-[#95f8a7] animate-bounce shadow-sm"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* PHASE 4: ERROR */}
        {phase === "error" && (
          <motion.div
            key="error"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeIn}
            className="w-full h-full absolute inset-0 bg-[#f7faf6] text-on-surface z-40 flex flex-col select-none"
          >
            {/* Ambient Background Blobs */}
            <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
            <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

            {/* Header: Transparent with close button */}
            <header className="flex justify-between items-center px-edge-margin h-16 w-full shrink-0 z-20 relative">
              <button
                onClick={() => router.push(ROUTES.home)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high active:scale-90 transition-transform cursor-pointer border border-outline-variant/10 shadow-xs"
                aria-label="Kembali ke Beranda"
              >
                <X className="w-5 h-5 text-on-surface" />
              </button>
              <h1 className="font-plus-jakarta-sans text-base font-black text-on-surface uppercase tracking-wider">
                Error
              </h1>
              <div className="w-10"></div> {/* Spacer */}
            </header>

            {/* Error Content card */}
            <div className="flex-1 flex flex-col justify-center items-center px-edge-margin text-center pb-20 relative z-10">
              <div className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2.5rem] p-8 backdrop-blur-lg flex flex-col items-center max-w-[340px]">
                <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/10 shadow-inner">
                  <CameraOff className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="font-plus-jakarta-sans text-lg font-black text-on-surface mb-2.5">
                  Kamera Tidak Diakses
                </h2>
                <p className="font-inter text-xs text-on-surface-variant mb-8 px-2 leading-relaxed">
                  Pastikan Anda telah memberikan izin akses kamera pada browser Anda untuk menggunakan fitur scan QR.
                </p>

                {/* Quick Recovery CTA */}
                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={handleSwitchToScanning}
                    className="w-full bg-gradient-to-r from-primary to-[#005c24] text-white py-4 rounded-full font-plus-jakarta-sans text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Coba Lagi</span>
                  </button>
                  <button
                    onClick={handleSwitchToManual}
                    className="w-full bg-white/80 hover:bg-white border border-outline-variant/35 text-primary py-4 rounded-full font-plus-jakarta-sans text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span>Input Manual</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
