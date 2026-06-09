// src/app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { useToast } from "@/stores/ToastContext";
import { validateEmail, validateOtpCode } from "@/lib/validators";
import { OtpInput } from "@/components/auth/OtpInput";
import { OtpCountdown } from "@/components/auth/OtpCountdown";
import { ROUTES } from "@/constants/routes";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, verify, isLoading: authLoading } = useAdminAuth();

  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [shakeTrigger, setShakeTrigger] = useState<boolean>(false);
  const [timerKey, setTimerKey] = useState<number>(0);

  // Step 1: Submit Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setEmailError("Email harus diisi");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Format email tidak valid");
      return;
    }

    setIsLoading(true);
    setEmailError(null);

    try {
      const result = await login(email);

      if (!result.success) {
        setEmailError(result.error?.message || "Email tidak valid atau tidak terdaftar.");
        toast.error(result.error?.message || "Gagal mengirim OTP.");
        setIsLoading(false);
        return;
      }

      toast.success("Kode OTP telah dikirim ke email Anda!");
      setIsLoading(false);
      setStep("otp");
      setCanResend(false);
      setTimerKey((prev) => prev + 1);
    } catch {
      setEmailError("Terjadi kesalahan sistem. Silakan coba lagi.");
      toast.error("Terjadi kesalahan sistem saat mengirim OTP.");
      setIsLoading(false);
    }
  };

  // Step 2: Submit OTP Verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateOtpCode(otp);
    if (validationError) {
      setOtpError(validationError);
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      return;
    }

    setIsLoading(true);
    setOtpError(null);
    setShakeTrigger(false);

    try {
      const result = await verify(email, otp);

      if (!result.success) {
        const errorMessage = result.error?.statusCode === 403
          ? "Akun ini tidak memiliki akses admin"
          : (result.error?.message || "Kode OTP salah.");
        setOtpError(errorMessage);
        setShakeTrigger(true);
        setIsLoading(false);
        setTimeout(() => setShakeTrigger(false), 500);
        return;
      }

      toast.success("Login sukses!");
      setIsLoading(false);
      setStep("success");

      // Redirect to dashboard after success screen shows
      setTimeout(() => {
        router.push(ROUTES.admin.dashboard);
      }, 1500);
    } catch {
      setOtpError("Terjadi kesalahan sistem. Silakan coba lagi.");
      toast.error("Terjadi kesalahan sistem saat verifikasi.");
      setIsLoading(false);
    }
  };

  // Back to Email Step
  const handleBackToEmail = () => {
    setOtp("");
    setOtpError(null);
    setStep("email");
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setOtpError(null);

    try {
      const result = await login(email);

      if (!result.success) {
        toast.error(result.error?.message || "Gagal mengirim ulang OTP.");
        setIsLoading(false);
        return;
      }

      toast.success("Kode OTP baru telah dikirim ke email.");
      setOtp("");
      setCanResend(false);
      setIsLoading(false);
      setTimerKey((prev) => prev + 1);
    } catch {
      toast.error("Terjadi kesalahan sistem saat mengirim ulang OTP.");
      setIsLoading(false);
    }
  };

  const isProcessing = isLoading || authLoading;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface relative overflow-hidden">
      {/* Modern subtle ambient grid background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ 
          backgroundImage: 'radial-gradient(circle, var(--color-outline) 1.5px, transparent 1.5px)', 
          backgroundSize: '24px 24px' 
        }} 
      />
      
      {/* Sleek abstract glow effects in the background */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-tertiary/5 blur-[100px] pointer-events-none" />

      {/* Main Card Container */}
      <main className="w-full max-w-[400px] bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 relative z-10 overflow-hidden transition-all duration-300">
        
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center transition-all duration-200">
            <Spinner className="text-primary" size="lg" />
            <p className="font-label-md text-label-md text-on-surface mt-xs font-semibold">Memproses...</p>
          </div>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary mb-3 shadow-[0_4px_12px_rgba(0,101,44,0.15)]">
            <span className="material-symbols-outlined text-[24px]">forest</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">ZOO Admin</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant/75 text-center mt-1">Sistem Informasi Manajemen &amp; Edukasi</p>
        </div>

        {/* Step 1: Email Input */}
        {step === "email" && (
          <div className="w-full animate-fade-in-up">
            <div className="mb-6 text-center">
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-1 font-semibold">Selamat Datang</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Masukkan email Anda untuk melanjutkan.</p>
            </div>
            <form className="space-y-5" onSubmit={handleEmailSubmit} noValidate>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface font-semibold" htmlFor="email">Email Admin</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/70" style={{ fontSize: "20px" }}>mail</span>
                  <input
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-outline/40"
                    id="email"
                    type="email"
                    placeholder="admin@zoo.com"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    disabled={isProcessing}
                  />
                </div>
                {emailError && (
                  <p className="font-label-sm text-label-sm text-error animate-fade-in-up mt-1.5 flex items-center gap-1" id="emailError">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {emailError}
                  </p>
                )}
              </div>
              <button
                className="w-full h-11 bg-primary hover:bg-primary/95 text-on-primary rounded-xl font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(0,101,44,0.12)] hover:shadow-[0_6px_16px_rgba(0,101,44,0.2)] active:scale-[0.98] group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isProcessing}
              >
                Kirim Kode OTP
                <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform text-[18px]">arrow_forward</span>
              </button>
              <p className="text-[12px] text-on-surface-variant/60 text-center font-medium">
                Pastikan email yang dimasukkan sudah terdaftar sebagai admin.
              </p>
            </form>
          </div>
        )}

        {/* Step 2: OTP Input */}
        {step === "otp" && (
          <div className="w-full animate-fade-in-up">
            <div className="mb-6 relative">
              <button
                className="flex items-center gap-1 text-on-surface-variant/70 hover:text-primary transition-colors mb-4 focus:outline-none rounded-md cursor-pointer disabled:opacity-50 font-label-sm text-label-sm font-semibold"
                id="backBtn"
                type="button"
                onClick={handleBackToEmail}
                disabled={isProcessing}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Kembali
              </button>
              <div className="text-center">
                <h2 className="font-headline-sm text-headline-sm text-on-surface mb-1 font-semibold">Masukkan Kode OTP</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Kode dikirim ke <span className="font-medium text-on-surface bg-secondary-container/20 text-secondary px-2 py-0.5 rounded-lg inline-block text-[13px]">{email}</span>
                </p>
              </div>
            </div>
            <form className="space-y-5" onSubmit={handleOtpSubmit} noValidate>
              <div className="flex flex-col">
                <OtpInput
                  length={6}
                  onChange={(val) => {
                    setOtp(val);
                    if (otpError) setOtpError(null);
                  }}
                  disabled={isProcessing}
                  hasError={!!otpError}
                  shakeTrigger={shakeTrigger}
                />
              </div>
              <div className="flex justify-between items-center px-1">
                {otpError ? (
                  <p className="font-label-sm text-label-sm text-error animate-fade-in-up flex items-center gap-1 flex-1" id="otpError">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {otpError}
                  </p>
                ) : (
                  <div className="flex-1" />
                )}
                <div className="text-right">
                  {!canResend ? (
                    <OtpCountdown
                      key={timerKey}
                      duration={600}
                      onComplete={() => setCanResend(true)}
                    />
                  ) : (
                    <p className="font-label-sm text-label-sm text-error font-semibold flex items-center gap-1 justify-end">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Kode kedaluwarsa
                    </p>
                  )}
                </div>
              </div>
              <button
                className="w-full h-11 bg-primary hover:bg-primary/95 text-on-primary rounded-xl font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(0,101,44,0.12)] hover:shadow-[0_6px_16px_rgba(0,101,44,0.2)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={otp.length < 6 || isProcessing}
              >
                Masuk ke Dashboard
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </button>
              <div className="text-center">
                <button
                  className={`font-label-sm text-label-sm transition-all focus:outline-none font-semibold ${
                    canResend && !isProcessing
                      ? "text-primary hover:text-primary-container cursor-pointer underline decoration-dotted underline-offset-4"
                      : "text-outline/40 cursor-not-allowed"
                  }`}
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || isProcessing}
                >
                  Kirim ulang kode
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {step === "success" && (
          <div className="w-full animate-fade-in-up flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center mb-4 text-primary animate-pulse">
              <span className="material-symbols-outlined text-primary animate-scale-up" style={{ fontSize: "40px" }}>verified</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1 font-bold">Login Berhasil</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Mengarahkan Anda ke Dashboard Admin...</p>
          </div>
        )}
      </main>
    </div>
  );
}
