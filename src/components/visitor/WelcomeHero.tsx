"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { ROUTES } from "@/constants/routes";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function WelcomeHero() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col md:flex-row bg-background relative overflow-hidden h-full min-h-[inherit]"
    >
      {/* HEADER / VISUAL AREA (approx 45% width on tablet, 486px height on mobile) */}
      <section className="h-[486px] md:h-full bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12] relative flex flex-col items-center justify-center pt-stack-lg md:pt-0 md:w-[45%] overflow-hidden">
        {/* Glow Effect */}
        <div
          aria-hidden="true"
          className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/15 blur-3xl z-0 pointer-events-none"
        ></div>

        {/* Floating Badges */}
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[16%] left-[6%] md:left-[10%] z-20 bg-white/10 backdrop-blur-md border border-white/20 text-on-primary px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-[11px] md:text-[12px] font-semibold select-none"
        >
          <span className="text-[14px]">🐾</span> 30+ Satwa
        </motion.div>

        <motion.div
          animate={{
            y: [0, 8, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[20%] right-[6%] md:right-[10%] z-20 bg-white/10 backdrop-blur-md border border-white/20 text-on-primary px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-[11px] md:text-[12px] font-semibold select-none"
        >
          <span className="text-[14px]">🎮</span> Kuis Interaktif
        </motion.div>

        <motion.div
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[28%] right-[6%] md:right-[12%] z-20 bg-white/10 backdrop-blur-md border border-white/20 text-on-primary px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-[11px] md:text-[12px] font-semibold select-none"
        >
          <span className="text-[14px]">🌿</span> Misi Edukasi
        </motion.div>

        {/* SVG Illustration Background placeholder / Graphic elements */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 opacity-15 pointer-events-none flex justify-center items-end"
        >
          <svg
            className="w-full h-auto text-on-primary fill-current max-h-[70%] md:max-h-[60%]"
            preserveAspectRatio="xMidYMax meet"
            viewBox="0 0 400 300"
          >
            {/* Tree Silhouette */}
            <path d="M50,300 L70,200 C50,180 30,190 20,160 C10,130 40,110 60,120 C70,90 100,80 120,100 C140,70 180,70 190,110 C220,100 240,130 220,160 C250,180 240,210 210,210 L230,300 Z" />
            {/* Elephant Silhouette */}
            <path d="M280,300 L280,260 C280,240 290,230 310,230 L340,230 C350,230 360,240 360,250 C360,260 350,270 340,270 L330,270 L330,300 L310,300 L310,270 C300,270 290,280 290,290 L290,300 Z M350,250 C370,250 380,260 380,280 C380,290 370,300 360,300 L350,300 C360,290 360,270 350,260 Z" />
          </svg>
        </div>

        {/* Content */}
        <motion.div
          variants={staggerItem}
          className="relative z-10 text-center px-edge-margin"
        >
          <span className="block text-[10px] md:text-[12px] uppercase tracking-[0.25em] text-[#95f8a7] font-bold mb-2 select-none">
            Wilderness Discovery
          </span>
          <h1 className="font-plus-jakarta-sans text-[64px] md:text-[80px] font-extrabold text-on-primary tracking-widest mb-stack-sm leading-[1.1] relative">
            ZOO
            <span className="absolute -inset-1 bg-gradient-to-r from-secondary-container/20 to-transparent blur-xl -z-10 rounded-full"></span>
          </h1>
          <p className="font-inter text-[14px] md:text-[16px] leading-[1.6] text-on-primary/80 max-w-[280px] mx-auto">
            Jelajahi, Pelajari, Lestarikan
          </p>
        </motion.div>
      </section>

      {/* BOTTOM CONTENT AREA / ACTION PANEL (approx 55% width on tablet) */}
      <motion.section
        variants={staggerItem}
        className="flex-1 bg-surface-container-lowest -mt-stack-lg md:-mt-0 rounded-t-[2.5rem] md:rounded-t-none md:rounded-l-[2.5rem] relative z-20 px-edge-margin py-10 md:py-16 md:px-12 flex flex-col justify-center shadow-[0_-12px_40px_rgba(0,0,0,0.08)] md:shadow-[-12px_0_40px_rgba(0,0,0,0.04)] md:w-[55%]"
      >
        <div className="flex-1 md:flex-initial md:my-auto flex flex-col justify-center">
          <h2 className="font-plus-jakarta-sans text-[26px] md:text-[32px] font-bold leading-[1.3] text-on-surface mb-stack-sm text-center">
            Selamat Datang, Penjelajah!
          </h2>
          <p className="font-inter text-[14px] md:text-[16px] leading-[1.6] text-on-surface-variant text-center mb-10 px-stack-sm max-w-[380px] mx-auto">
            Scan kandang satwa, jawab kuis, dan lihat seberapa besar dampak edukasi kunjunganmu hari ini.
          </p>
        </div>

        <div className="mt-auto md:mt-0 flex flex-col gap-4 max-w-[380px] w-full mx-auto">
          {/* Button 1: Mulai Petualangan */}
          <Link
            href={ROUTES.register}
            className="group block w-full bg-primary text-on-primary rounded-full py-4 text-center font-plus-jakarta-sans text-[18px] font-semibold leading-[1.4] shadow-md hover:bg-primary/95 hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Mulai Petualangan{" "}
            <motion.span
              className="inline-block"
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }}
            >
              🦁
            </motion.span>
          </Link>

          {/* Button 2: Masuk (Sudah Punya Akun) */}
          <Link
            href={ROUTES.login}
            className="block w-full bg-secondary-container text-on-secondary-container rounded-full py-4 text-center font-plus-jakarta-sans text-[18px] font-semibold leading-[1.4] shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border border-secondary-container/20"
          >
            Masuk ke Akun <span aria-hidden="true">🔑</span>
          </Link>

          <p className="text-center font-inter text-[12px] leading-[1.6] text-on-surface-variant/70 mt-2">
            Dengan masuk atau mendaftar, Anda menyetujui Ketentuan Penggunaan Zoo.
          </p>
        </div>
      </motion.section>
    </motion.div>
  );
}

