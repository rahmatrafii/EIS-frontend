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
      <section className="h-[486px] md:h-full bg-primary relative flex flex-col items-center justify-center pt-stack-lg md:pt-0 md:w-[45%] overflow-hidden">
        {/* SVG Illustration Background placeholder / Graphic elements */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 opacity-20 pointer-events-none flex justify-center items-end"
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
          <h1 className="font-plus-jakarta-sans text-[60px] md:text-[72px] font-extrabold text-on-primary tracking-tighter mb-stack-sm leading-[1.1]">
            ZOO
          </h1>
          <p className="font-inter text-[14px] md:text-[16px] leading-[1.6] text-on-primary/80 max-w-[280px] mx-auto">
            Jelajahi, Pelajari, Lestarikan
          </p>
        </motion.div>
      </section>

      {/* BOTTOM CONTENT AREA / ACTION PANEL (approx 55% width on tablet) */}
      <motion.section
        variants={staggerItem}
        className="flex-1 bg-surface-container-lowest -mt-stack-lg md:-mt-0 rounded-t-xl md:rounded-t-none md:rounded-l-[2rem] relative z-20 px-edge-margin py-stack-lg md:py-16 md:px-12 flex flex-col justify-center shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-[-8px_0_30px_rgba(0,0,0,0.06)] md:w-[55%]"
      >
        <div className="flex-1 md:flex-initial md:my-auto flex flex-col justify-center">
          <h2 className="font-plus-jakarta-sans text-[24px] md:text-[28px] font-bold leading-[1.3] text-on-surface mb-stack-sm text-center">
            Selamat Datang, Penjelajah!
          </h2>
          <p className="font-inter text-[14px] md:text-[16px] leading-[1.6] text-on-surface-variant text-center mb-stack-lg px-stack-sm max-w-[380px] mx-auto">
            Scan kandang satwa, jawab kuis, dan lihat seberapa besar dampak edukasi kunjunganmu hari ini.
          </p>
        </div>

        <div className="mt-auto md:mt-0 flex flex-col gap-4">
          <Link
            href={ROUTES.register}
            className="block w-full bg-primary text-on-primary rounded-full py-4 text-center font-plus-jakarta-sans text-[20px] font-semibold leading-[1.4] shadow-sm hover:opacity-90 active:scale-95 transition-all duration-200 mb-stack-md flex items-center justify-center gap-2"
          >
            Mulai Petualangan <span aria-hidden="true">🦁</span>
          </Link>
          <p className="text-center font-inter text-[14px] leading-[1.6] text-on-surface-variant">
            Sudah pernah berkunjung?{" "}
            <Link
              href={ROUTES.login}
              className="text-primary font-semibold hover:underline decoration-2 underline-offset-2"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </motion.section>
    </motion.div>
  );
}

