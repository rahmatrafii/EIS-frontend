// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/visitor/MobileShell";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/layout/visitor/PageHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { ROUTES } from "@/constants/routes";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState<string>("");

  // Handle custom back action depending on current login step
  function handleBack() {
    if (step === "otp") {
      setStep("email");
    } else {
      router.push(ROUTES.welcome);
    }
  }

  return (
    <MobileShell>
      <PageTransition className="md:flex md:flex-row md:items-stretch md:min-h-full md:bg-surface">
        {/* Header/Info Section (approx 40% width on tablet) */}
        <section className="bg-primary pt-12 pb-16 px-edge-margin relative md:w-[40%] md:h-full md:pt-0 md:pb-0 md:px-10 md:flex md:flex-col md:justify-center md:rounded-r-3xl md:rounded-tl-none md:z-30 md:shadow-[4px_0_20px_rgba(0,0,0,0.05)]">
          {/* Decorative circular element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container rounded-full opacity-20 -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <PageHeader 
            className="mb-8 md:absolute md:top-8 md:left-8 md:mb-0" 
            onBack={handleBack} 
          />

          <div className="text-center md:text-left z-10 relative md:mt-8">
            <h1 className="font-plus-jakarta-sans text-[24px] md:text-[32px] font-bold text-on-primary mb-2 leading-[1.3]">
              {step === "otp" ? "Verifikasi Email" : "Masuk"}
            </h1>
            <p className="font-inter text-[14px] md:text-[16px] text-on-primary/80 leading-[1.6]">
              {step === "otp" 
                ? "Verifikasi identitas penjelajahmu" 
                : "Selamat datang kembali, Penjelajah!"}
            </p>
          </div>
        </section>

        {/* Content Area / Form Canvas (approx 60% width on tablet) */}
        <section className="flex-1 bg-surface rounded-t-2xl -mt-6 md:-mt-0 px-edge-margin pt-8 pb-12 md:pt-16 md:px-12 z-20 relative min-h-[480px] md:min-h-full md:w-[60%] md:flex md:flex-col md:justify-center md:shadow-none md:rounded-t-none md:overflow-y-auto">
          <div className="w-full max-w-[400px] mx-auto flex flex-col justify-center h-full">
            <LoginForm 
              step={step} 
              setStep={setStep} 
              email={email} 
              setEmail={setEmail} 
            />
          </div>
        </section>
      </PageTransition>
    </MobileShell>
  );
}

