// src/components/auth/OtpCountdown.tsx
"use client";

import { useEffect, useState } from "react";

interface OtpCountdownProps {
  duration?: number; // duration in seconds
  onComplete: () => void;
}

export function OtpCountdown({ duration = 60, onComplete }: OtpCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return (
    <p className="font-inter text-[14px] text-on-surface-variant/60">
      Kode berakhir dalam <span className="font-bold text-on-surface">{formattedTime}</span>
    </p>
  );
}
