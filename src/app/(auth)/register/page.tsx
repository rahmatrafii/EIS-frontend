import { MobileShell } from "@/components/layout/visitor/MobileShell";
import { PageTransition } from "@/components/layout/PageTransition";
import { PageHeader } from "@/components/layout/visitor/PageHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <MobileShell>
      <PageTransition className="md:flex md:flex-row md:items-stretch md:min-h-full md:bg-surface">
        {/* Header/Info Section (approx 40% width on tablet) */}
        <section className="bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12] pt-12 pb-16 px-edge-margin relative md:w-[40%] md:h-full md:pt-0 md:pb-0 md:px-10 md:flex md:flex-col md:justify-center md:rounded-r-[2.5rem] md:rounded-tl-none md:z-30 md:shadow-[6px_0_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Glow Effect */}
          <div
            aria-hidden="true"
            className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none"
          ></div>
          
          <PageHeader className="mb-8 md:absolute md:top-8 md:left-8 md:mb-0" />
          
          <div className="text-center md:text-left z-10 relative md:mt-8 select-none">
            <span className="block text-[10px] md:text-[12px] uppercase tracking-[0.25em] text-[#95f8a7] font-bold mb-2">
              Zoo Exploration
            </span>
            <h1 className="font-plus-jakarta-sans text-[26px] md:text-[34px] font-bold text-on-primary mb-2 leading-[1.3]">
              Daftar Akun
            </h1>
            <p className="font-inter text-[14px] md:text-[16px] text-on-primary/80 leading-[1.6]">
              Buat akunmu untuk mulai berpetualangan
            </p>
          </div>
        </section>

        {/* Form Area (approx 60% width on tablet) */}
        <section className="flex-1 bg-surface-container-lowest rounded-t-[2.5rem] md:rounded-t-none px-edge-margin pt-8 pb-12 md:pt-16 md:px-12 z-20 relative min-h-[480px] md:min-h-full md:w-[60%] md:flex md:flex-col md:justify-center md:shadow-none md:rounded-t-none md:overflow-y-auto -mt-10 md:-mt-0">
          <div className="w-full max-w-[400px] mx-auto flex flex-col justify-center h-full">
            <RegisterForm />
          </div>
        </section>
      </PageTransition>
    </MobileShell>
  );
}

