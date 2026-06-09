"use client";

import React from "react";
import { cn } from "@/lib/cn";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 stroke-[3]",
    md: "h-6 w-6 stroke-[2.5]",
    lg: "h-8 w-8 stroke-[2]",
  };

  return (
    <svg
      className={cn("animate-spin text-current", sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
