// src/components/visitor/SessionTimer.tsx
"use client";

import { useEffect, useState } from "react";

interface SessionTimerProps {
  checkInAt?: string;
  checkInLabel?: string;
}

export function SessionTimer({ checkInAt, checkInLabel = "09:00 WIB" }: SessionTimerProps) {
  // Calculate initial elapsed time directly in state to avoid flash of "00:00" and fix synchronous setState lints
  const [elapsed, setElapsed] = useState<string>(() => {
    if (!checkInAt) return "00:00";
    const checkInTime = new Date(checkInAt).getTime();
    if (isNaN(checkInTime)) return "00:00";

    const diffMs = Date.now() - checkInTime;
    if (diffMs <= 0) return "00:00";

    const totalSec = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const formattedMins = mins.toString().padStart(2, "0");
    const formattedSecs = secs.toString().padStart(2, "0");

    if (hrs > 0) {
      const formattedHrs = hrs.toString().padStart(2, "0");
      return `${formattedHrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${formattedMins}:${formattedSecs}`;
  });

  useEffect(() => {
    if (!checkInAt) return;

    const checkInTime = new Date(checkInAt).getTime();
    if (isNaN(checkInTime)) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = now - checkInTime;

      if (diffMs <= 0) {
        setElapsed("00:00");
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      const formattedMins = mins.toString().padStart(2, "0");
      const formattedSecs = secs.toString().padStart(2, "0");

      if (hrs > 0) {
        const formattedHrs = hrs.toString().padStart(2, "0");
        setElapsed(`${formattedHrs}:${formattedMins}:${formattedSecs}`);
      } else {
        setElapsed(`${formattedMins}:${formattedSecs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [checkInAt]);

  return (
    <div className="flex items-center gap-3 mt-4 fade-in-up" style={{ animationDelay: "0.3s" }}>
      <div className="bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
        <div className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></div>
        <span className="font-plus-jakarta-sans text-[10px] font-bold uppercase tracking-wider">
          Sesi Aktif ({elapsed})
        </span>
      </div>
      <span className="text-xs text-on-primary/60">Check-in: {checkInLabel}</span>
    </div>
  );
}
