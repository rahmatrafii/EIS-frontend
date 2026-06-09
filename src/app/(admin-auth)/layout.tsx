// src/app/(admin-auth)/layout.tsx
"use client";

import type { ReactNode } from "react";
import { Work_Sans } from "next/font/google";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  const adminThemeStyles = {
    fontFamily: "var(--font-work-sans), sans-serif",
    "--color-background": "#f8f9fa",
    "--color-primary": "#005d42",
    "--color-tertiary": "#005d3e",
    "--color-primary-fixed-dim": "#7bd8b1",
    "--color-surface-container-lowest": "#ffffff",
    "--color-surface-container-high": "#e7e8e9",
    "--color-surface-container": "#edeeef",
    "--color-surface-container-highest": "#e1e3e4",
    "--color-surface-container-low": "#f3f4f5",
    "--color-error": "#ba1a1a",
    "--color-on-primary": "#ffffff",
    "--color-on-surface": "#191c1d",
    "--color-on-surface-variant": "#3e4943",
    "--color-outline": "#6e7a73",
    "--color-outline-variant": "#bdc9c1",
    "--color-secondary": "#2b6954",
    "--color-secondary-container": "#adedd3",
    "--color-error-container": "#ffdad6",
    "--color-on-error": "#ffffff",
    "--color-inverse-surface": "#2e3132",
    "--color-primary-container": "#047857",
    "--color-surface": "#f8f9fa",
    "--color-on-tertiary": "#ffffff",
    "--color-on-secondary": "#ffffff",
    "--color-on-error-container": "#93000a",
  } as React.CSSProperties;

  return (
    <div
      className={`${workSans.variable} min-h-screen bg-background`}
      style={adminThemeStyles}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      {children}
    </div>
  );
}
