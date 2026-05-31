// src/components/auth/LoginForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Check, Info, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/auth/OtpInput";
import { OtpCountdown } from "@/components/auth/OtpCountdown";
import { useToast } from "@/stores/ToastContext";
import { requestOtp, verifyOtp } from "@/services/auth.service";
import { saveToken, getActiveSessionId } from "@/lib/token";
import { validateEmail } from "@/lib/validators";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/lib/animations";

interface LoginFormProps {
  step: "email" | "otp";
  setStep: (step: "email" | "otp") => void;
  email: string;
  setEmail: (email: string) => void;
}

export function LoginForm({ step, setStep, email, setEmail }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [otp, setOtp] = useState<string>("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [shakeTrigger, setShakeTrigger] = useState<boolean>(false);
  const [timerKey, setTimerKey] = useState<number>(0);

  // Restore email from sessionStorage on mount (if available)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = sessionStorage.getItem("loginEmail");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, [setEmail]);

  // Handle countdown timer completion
  function handleCountdownComplete() {
    setCanResend(true);
  }

  // Handle changes to email input
  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError(undefined);
    }
  }

  // Handle Step 1 Submit: Request OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email harus diisi");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Format email tidak valid");
      return;
    }

    setIsSubmitting(true);
    setEmailError(undefined);

    try {
      const result = await requestOtp(email.trim().toLowerCase());

      if (!result.success) {
        toast.error(result.error.message || "Gagal mengirim OTP. Silakan coba lagi.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Kode OTP telah dikirim ke email kamu!");
      
      // Save email for next step or restoration
      if (typeof window !== "undefined") {
        sessionStorage.setItem("loginEmail", email.trim());
      }

      setStep("otp");
      setCanResend(false);
      setTimerKey((prev) => prev + 1);
    } catch {
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Step 2 Submit: Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6 || isSubmitting) return;

    setIsSubmitting(true);
    setOtpError(null);
    setShakeTrigger(false);

    try {
      const result = await verifyOtp({
        email: email.trim().toLowerCase(),
        otp: otp,
      });

      if (!result.success) {
        setOtpError(result.error.message || "Kode OTP yang kamu masukkan salah.");
        setShakeTrigger(true);
        setIsSubmitting(false);

        // Reset shake trigger after animation finishes
        setTimeout(() => {
          setShakeTrigger(false);
        }, 500);
        return;
      }

      toast.success("Masuk berhasil!");

      // Save JWT to localStorage
      saveToken(result.data.token);

      // Set auth & role cookies for server-side middleware
      document.cookie = `eis_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = `eis_role=${result.data.user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // Determine redirect URL:
      // If there is an active session in progress, go to /home. Otherwise go to pre-test /quiz/pre-zoo.
      const activeSession = getActiveSessionId();
      if (activeSession) {
        router.push(ROUTES.home);
      } else {
        router.push(ROUTES.quiz.preZoo);
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memverifikasi. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  }

  // Handle Resend OTP Request
  async function handleResendOtp() {
    if (!canResend || isResending) return;

    setIsResending(true);
    setOtpError(null);
    setShakeTrigger(false);

    try {
      const result = await requestOtp(email.trim().toLowerCase());

      if (!result.success) {
        toast.error(result.error.message || "Gagal mengirim ulang OTP.");
        setIsResending(false);
        return;
      }

      toast.success("Kode OTP baru telah dikirim ke email.");
      setOtp(""); // Clear input OTP
      setCanResend(false);
      setIsResending(false);
      setTimerKey((prev) => prev + 1); // Reset timer countdown
    } catch {
      toast.error("Terjadi kesalahan sistem saat mengirim ulang OTP.");
      setIsResending(false);
    }
  }

  // STEP 1: Email Form UI
  if (step === "email") {
    return (
      <form onSubmit={handleSendOtp} noValidate className="flex flex-col flex-1 h-full gap-stack-md">
        <div className="mb-2">
          <label className="block font-plus-jakarta-sans text-[12px] font-bold tracking-wider uppercase text-on-surface-variant mb-2 ml-1" htmlFor="email">
            Email yang terdaftar <span className="text-error">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline flex items-center justify-center pointer-events-none">
              <Mail className="h-5 w-5" />
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              disabled={isSubmitting}
              className={`w-full bg-surface-container-lowest border rounded-xl py-4 pl-12 pr-4 font-inter text-[14px] text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none ${
                emailError ? "border-error focus:ring-error focus:border-error" : "border-outline-variant"
              }`}
              placeholder="contoh@email.com"
              required
            />
          </div>
          {emailError && (
            <span className="text-error text-xs ml-1 mt-1 block animate-fade-in-up">
              {emailError}
            </span>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-4 flex items-start gap-3 mb-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="font-inter text-[14px] text-on-surface-variant leading-[1.6]">
            Kode OTP akan dikirim ke email kamu untuk memastikan keamanan akun.
          </p>
        </div>

        {/* Spacer to push elements down */}
        <div className="flex-1" />

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          className="w-full py-4 bg-primary text-on-primary rounded-full font-plus-jakarta-sans text-[20px] font-semibold flex items-center justify-center gap-2 hover:bg-primary-container transition-all duration-200 active:scale-95 shadow-sm mt-auto"
        >
          <span>Kirim Kode OTP</span>
          {!isSubmitting && <ArrowRight className="h-5 w-5 transition-transform" />}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-outline-variant/30" />
          <span className="font-inter text-[12px] text-outline uppercase tracking-wider">atau</span>
          <div className="flex-1 h-px bg-outline-variant/30" />
        </div>

        {/* Register Navigation Button */}
        <button
          type="button"
          onClick={() => router.push(ROUTES.register)}
          className="w-full bg-transparent border-2 border-primary text-primary rounded-full py-4 font-plus-jakarta-sans text-[20px] font-semibold hover:bg-primary/5 active:scale-95 transition-all duration-200 select-none cursor-pointer mb-2"
        >
          Daftar Sekarang
        </button>
      </form>
    );
  }

  // STEP 2: OTP Verification UI
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col flex-1 w-full"
    >
      {/* Illustration Envelope */}
      <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-sm mx-auto">
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

      {/* Verification Form */}
      <form onSubmit={handleVerifyOtp} className="w-full flex flex-col items-center flex-1">
        {/* OTP Input Squares */}
        <OtpInput
          length={6}
          onChange={setOtp}
          disabled={isSubmitting}
          hasError={!!otpError}
          shakeTrigger={shakeTrigger}
        />

        {/* Error Message */}
        {otpError && (
          <p className="text-error font-inter text-[14px] text-center mb-4 mt-1 animate-fade-in-up">
            {otpError}
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Verify Submit Button */}
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          disabled={otp.length < 6 || isSubmitting}
          className="w-full py-4 bg-primary text-on-primary rounded-full font-plus-jakarta-sans text-[20px] font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all duration-100 shadow-lg mt-auto"
        >
          <span>Masuk Sekarang</span>
          {!isSubmitting && <Check className="h-5 w-5 ml-1" />}
        </Button>
      </form>

      {/* Resend OTP Block */}
      <div className="text-center mt-6">
        <p className="font-inter text-[14px] text-on-surface-variant">
          Tidak menerima kode?{" "}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={!canResend || isResending}
            className="text-primary font-bold disabled:text-outline disabled:cursor-not-allowed transition-colors select-none cursor-pointer"
          >
            {isResending ? "Mengirim..." : "Kirim ulang"}
          </button>
        </p>
      </div>
    </motion.div>
  );
}
