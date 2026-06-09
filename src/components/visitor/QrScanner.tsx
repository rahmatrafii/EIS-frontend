// src/components/visitor/QrScanner.tsx
"use client";

import { RefObject } from "react";
import { cn } from "@/lib/cn";

interface QrScannerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
  className?: string;
}

export function QrScanner({ videoRef, isScanning, className }: QrScannerProps) {
  return (
    <div className={cn("flex-1 relative flex items-center justify-center bg-black overflow-hidden", className)}>
      {/* Video stream */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        muted
        playsInline
      />

      {/* QR Target Reticle Container */}
      <div className="relative w-[260px] h-[260px] z-20">
        {/* Reticle corners */}
        <div
          className="absolute w-10 h-10 border-primary border-t-4 border-l-4 rounded-tl-2xl"
          style={{ top: 0, left: 0 }}
        />
        <div
          className="absolute w-10 h-10 border-primary border-t-4 border-r-4 rounded-tr-2xl"
          style={{ top: 0, right: 0 }}
        />
        <div
          className="absolute w-10 h-10 border-primary border-b-4 border-l-4 rounded-bl-2xl"
          style={{ bottom: 0, left: 0 }}
        />
        <div
          className="absolute w-10 h-10 border-primary border-b-4 border-r-4 rounded-br-2xl"
          style={{ bottom: 0, right: 0 }}
        />

        {/* Scan Laser Line */}
        {isScanning && (
          <div className="absolute top-2 left-0 w-full h-[2px] bg-primary shadow-[0_0_12px_3px_rgba(0,101,44,0.7)] animate-scanline z-30" />
        )}
      </div>

      {/* Dark overlay outside the reticle area using clip-path */}
      <div
        className="absolute inset-0 bg-black/60 pointer-events-none z-10"
        style={{
          clipPath:
            "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, calc(50% - 130px) calc(50% - 130px), calc(50% - 130px) calc(50% + 130px), calc(50% + 130px) calc(50% + 130px), calc(50% + 130px) calc(50% - 130px), calc(50% - 130px) calc(50% - 130px))",
        }}
      />
    </div>
  );
}
