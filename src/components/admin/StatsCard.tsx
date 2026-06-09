// src/components/admin/StatsCard.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  change?: string;
  changeType?: "up" | "down" | "live" | "neutral";
  suffix?: string;
  subtext?: string;
  children?: React.ReactNode;
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeType = "neutral",
  suffix,
  subtext,
  children,
}: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          hasAnimated.current = true;
          animateCountUp();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  });

  const animateCountUp = () => {
    const duration = 1200;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  const getColorScheme = () => {
    switch (icon) {
      case "groups":
        return {
          bg: "rgba(0, 101, 44, 0.06)",
          text: "var(--color-primary)",
        };
      case "psychology":
        return {
          bg: "rgba(151, 52, 74, 0.06)",
          text: "var(--color-tertiary)",
        };
      case "timer":
        return {
          bg: "rgba(43, 105, 84, 0.06)",
          text: "var(--color-secondary)",
        };
      case "devices":
        return {
          bg: "rgba(0, 109, 48, 0.06)",
          text: "var(--color-surface-tint)",
        };
      default:
        return {
          bg: "var(--color-surface-container-high)",
          text: "var(--color-on-surface-variant)",
        };
    }
  };

  const getBadgeStyle = () => {
    switch (changeType) {
      case "up":
        return {
          backgroundColor: "rgba(0, 110, 45, 0.08)",
          color: "var(--color-secondary)",
        };
      case "down":
        return {
          backgroundColor: "rgba(186, 26, 26, 0.08)",
          color: "var(--color-error)",
        };
      case "live":
        return {
          backgroundColor: "rgba(0, 101, 44, 0.08)",
          color: "var(--color-primary)",
        };
      default:
        return {
          backgroundColor: "var(--color-surface-container-high)",
          color: "var(--color-on-surface-variant)",
        };
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "up":
        return "trending_up";
      case "down":
        return "trending_down";
      default:
        return null;
    }
  };

  return (
    <div
      ref={cardRef}
      className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)]"
      style={{
        backgroundColor: "var(--color-surface-container-lowest)",
        border: "1px solid rgba(189,201,193,0.35)",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* Ambient background glow */}
      <div 
        className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1]"
        style={{
          backgroundColor: getColorScheme().text,
        }}
      />

      {/* Top Row: Icon Badge + Change Badge */}
      <div className="flex justify-between items-center mb-5 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
          style={{
            backgroundColor: getColorScheme().bg,
            color: getColorScheme().text,
          }}
        >
          <span className="material-symbols-outlined select-none" style={{ fontSize: "20px" }}>
            {icon}
          </span>
        </div>
        {change && (
          <span
            className="flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold"
            style={getBadgeStyle()}
          >
            {changeType === "live" && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
              />
            )}
            {getChangeIcon() && (
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                {getChangeIcon()}
              </span>
            )}
            {change}
          </span>
        )}
      </div>

      {/* Value & Info */}
      <div className="relative z-10 flex flex-col">
        <h3
          className="font-label-sm text-label-sm font-semibold tracking-wider uppercase mb-1"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          {title}
        </h3>
        <div
          className="font-headline-xl text-[32px] font-bold leading-none flex items-baseline gap-1.5"
          style={{ color: "var(--color-on-surface)" }}
        >
          <span>{displayValue.toLocaleString()}</span>
          {suffix && (
            <span
              className="font-headline-sm text-headline-sm font-semibold"
              style={{ color: "var(--color-outline)" }}
            >
              {suffix}
            </span>
          )}
        </div>
        {subtext && (
          <p
            className="font-body-sm text-body-sm mt-1 text-outline/80"
          >
            {subtext}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
