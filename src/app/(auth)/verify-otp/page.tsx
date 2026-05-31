// src/app/(auth)/verify-otp/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Check } from "lucide-react";

import { MobileShell } from "@/components/layout/visitor/MobileShell";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/layout/visitor/PageHeader";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/auth/OtpInput";
import { OtpCountdown } from "@/components/auth/OtpCountdown";
import { useToast } from "@/stores/ToastContext";
import { verifyOtp, requestOtp } from "@/services/auth.service";
import { saveToken } from "@/lib/token";
import { ROUTES } from "@/constants/routes";

export default function VerifyOtpPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState<boolean>(false);
  
  // key untuk me-reset state internal komponen timer OtpCountdown saat Kirim Ulang
  const [timerKey, setTimerKey] = useState<number>(0);

  // Ambil e-mail dari sessionStorage saat mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("email");
      if (!storedEmail) {
        toast.warning("Silakan isi registrasi terlebih dahulu.");
        router.replace(ROUTES.register);
        return;
      }
      setEmail(storedEmail);
    }
  }, [router, toast]);

  // Callback dari OtpCountdown saat timer habis (00:00)
  function handleCountdownComplete() {
    setCanResend(true);
  }

  // Handler verifikasi kode OTP
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6 || isVerifying) return;

    setIsVerifying(true);
    setErrorMsg(null);
    setShakeTrigger(false);

    try {
      const result = await verifyOtp({
        email: email,
        otp: otp,
      });

      if (!result.success) {
        setErrorMsg(result.error.message || "Kode OTP yang kamu masukkan salah.");
        setShakeTrigger(true);
        setIsVerifying(false);

        // Reset shake trigger setelah animasi getar selesai
        setTimeout(() => {
          setShakeTrigger(false);
        }, 500);
        return;
      }

      toast.success("Verifikasi berhasil!");

      // Simpan token JWT ke localStorage
      saveToken(result.data.token);

      // Simpan cookie sinyal auth untuk middleware server-side (SOP-07)
      document.cookie = `eis_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = `eis_role=${result.data.user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // Redirect ke halaman pre-zoo test (SOP-13 V-03)
      router.push(ROUTES.quiz.preZoo);
    } catch {
      toast.error("Terjadi kesalahan sistem saat memverifikasi. Silakan coba lagi.");
      setIsVerifying(false);
    }
  }

  // Handler kirim ulang kode OTP
  async function handleResend() {
    if (!canResend || isResending) return;

    setIsResending(true);
    setErrorMsg(null);
    setShakeTrigger(false);

    try {
      const result = await requestOtp(email);

      if (!result.success) {
        toast.error(result.error.message || "Gagal mengirim ulang OTP.");
        setIsResending(false);
        return;
      }

      toast.success("Kode OTP baru telah dikirim ke email.");
      setOtp(""); // Clear OTP input state
      setCanResend(false);
      setIsResending(false);
      
      // Increment timerKey untuk memaksa reset komponen OtpCountdown
      setTimerKey((prev) => prev + 1);
    } catch {
      toast.error("Terjadi kesalahan sistem saat mengirim ulang OTP.");
      setIsResending(false);
    }
  }

  // Mencegah rendering penuh jika email kosong (menghindari visual flash sebelum redirect)
  if (!email) {
    return (
      <MobileShell>
        <div className="flex items-center justify-center min-h-screen bg-surface-container-low text-on-surface">
          <p className="font-inter text-sm">Loading...</p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <PageTransition className="md:flex md:flex-row md:items-stretch md:min-h-full md:bg-surface">
        {/* Header Section (approx 40% width on tablet) */}
        <section className="bg-primary pt-12 pb-16 px-edge-margin relative md:w-[40%] md:h-full md:pt-0 md:pb-0 md:px-10 md:flex md:flex-col md:justify-center md:rounded-r-3xl md:rounded-tl-none md:z-30 md:shadow-[4px_0_20px_rgba(0,0,0,0.05)]">
          {/* Decorative circular element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container rounded-full opacity-20 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <PageHeader
            centerTitle
            title="Verifikasi Email"
            backHref={ROUTES.register}
            className="mb-8 md:absolute md:top-8 md:left-8 md:mb-0"
          />
        </section>

        {/* Main Canvas Area (approx 60% width on tablet) */}
        <main className="flex-1 bg-surface rounded-t-2xl -mt-6 md:-mt-0 px-edge-margin pt-8 pb-12 md:pt-16 md:px-12 z-20 relative flex flex-col items-center min-h-[500px] md:min-h-full md:w-[60%] md:flex md:flex-col md:justify-center md:shadow-none md:rounded-t-none md:overflow-y-auto">
          <div className="w-full max-w-[400px] mx-auto flex flex-col justify-center h-full items-center">
            {/* Illustration envelope */}
            <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Mail className="h-12 w-12 text-primary stroke-[1.5]" />
            </div>

            {/* Instructions */}
            <div className="text-center mb-8 w-full">
              <h2 className="font-plus-jakarta-sans text-[24px] font-bold text-on-surface mb-2 leading-[1.3]">
                Cek emailmu!
              </h2>
              <p className="font-inter text-[14px] text-on-surface-variant mb-2 leading-[1.6]">
                Kami mengirim kode 6 digit ke<br />
                <span className="font-bold text-primary">{email}</span>
              </p>
              <p className="font-plus-jakarta-sans text-[12px] font-bold tracking-wider uppercase text-outline">
                Kode berlaku selama 10 menit
              </p>
            </div>

            {/* Form OTP Input */}
            <form onSubmit={handleVerify} className="w-full flex flex-col items-center">
              
              {/* Input boxes */}
              <OtpInput
                length={6}
                onChange={setOtp}
                disabled={isVerifying}
                hasError={!!errorMsg}
                shakeTrigger={shakeTrigger}
              />

              {/* Error Message */}
              {errorMsg && (
                <p className="text-error font-inter text-[14px] text-center mb-4 mt-1 animate-fade-in-up">
                  {errorMsg}
                </p>
              )}

              {/* Visual Countdown Timer */}
              <div className="text-center mb-8 h-6 flex items-center justify-center">
                {!canResend ? (
                  <OtpCountdown
                    key={timerKey}
                    duration={60}
                    onComplete={handleCountdownComplete}
                  />
                ) : (
                  <p className="font-inter text-[14px] text-error font-semibold">
                    Kode sudah kadaluarsa
                  </p>
                )}
              </div>

              {/* Verify Submit Button */}
              <Button
                type="submit"
                size="lg"
                isLoading={isVerifying}
                disabled={otp.length < 6 || isVerifying}
                className="w-full py-4 bg-primary text-on-primary rounded-full font-plus-jakarta-sans text-[20px] font-semibold flex items-center justify-center gap-2 active:scale-95 duration-100 shadow-lg cursor-pointer select-none"
              >
                <span>Verifikasi Sekarang</span>
                {!isVerifying && <Check className="h-5 w-5 ml-1" />}
              </Button>
            </form>

            {/* Resend OTP Block */}
            <div className="text-center mt-6">
              <p className="font-inter text-[14px] text-on-surface-variant">
                Tidak menerima kode?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || isResending}
                  className="text-primary font-bold disabled:text-outline disabled:cursor-not-allowed transition-colors select-none cursor-pointer"
                >
                  {isResending ? "Mengirim..." : "Kirim ulang"}
                </button>
              </p>
            </div>
          </div>
        </main>
      </PageTransition>
    </MobileShell>
  );
}
