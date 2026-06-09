"use client";

import React from "react";

interface PageLoaderProps {
  text?: string;
  minHeight?: string;
}

export function PageLoader({ text = "Memuat...", minHeight = "min-h-[60vh]" }: PageLoaderProps) {
  return (
    <div className={`flex-1 flex flex-col justify-center items-center bg-background p-6 ${minHeight} select-none animate-fade-in`}>
      <div className="relative w-12 h-12 flex items-center justify-center mb-5">
        {/* Soft pulse outer circle */}
        <div className="absolute w-12 h-12 rounded-full bg-primary/5 animate-pulse" />
        {/* Elegant double-arc spinner */}
        <div className="absolute w-10 h-10 rounded-full border-2 border-transparent border-t-primary border-b-primary animate-spin" />
        {/* Central solid brand dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      </div>
      <p className="font-plus-jakarta-sans text-[11px] font-extrabold tracking-widest text-primary/75 uppercase animate-pulse text-center max-w-[280px]">
        {text}
      </p>
    </div>
  );
}
