// src/components/admin/MediaEffectivenessGrid.tsx
"use client";

import type { MediaEffectiveness } from "@/types/admin.types";

interface MediaEffectivenessGridProps {
  data: MediaEffectiveness[];
}

interface MediaConfig {
  name: string;
  icon: string;
  bgColor: string;
  textColor: string;
}

const mediaConfigMap: Record<string, MediaConfig> = {
  INTERACTIVE_LAB: {
    name: "Interactive Lab",
    icon: "touch_app",
    bgColor: "rgba(0, 93, 66, 0.08)",
    textColor: "var(--color-primary)",
  },
  AUDIO: {
    name: "Audio Guide",
    icon: "headphones",
    bgColor: "rgba(151, 52, 74, 0.08)",
    textColor: "var(--color-tertiary)",
  },
  VIDEO: {
    name: "Video Kiosk",
    icon: "smart_display",
    bgColor: "rgba(43, 105, 84, 0.08)",
    textColor: "var(--color-secondary)",
  },
  IMAGE_INFOGRAPHIC: {
    name: "Infografis",
    icon: "chrome_reader_mode",
    bgColor: "rgba(0, 109, 48, 0.08)",
    textColor: "var(--color-surface-tint)",
  },
};

export default function MediaEffectivenessGrid({
  data,
}: MediaEffectivenessGridProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: "var(--color-surface-container-lowest)",
        border: "1px solid rgba(189,201,193,0.35)",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3
          className="font-headline-sm text-headline-sm"
          style={{ color: "var(--color-on-surface)" }}
        >
          Efektivitas Media Edukasi
        </h3>
        <span
          className="font-body-sm text-body-sm"
          style={{ color: "var(--color-outline)" }}
        >
          Peningkatan Pengetahuan vs Rata-rata Skor
        </span>
      </div>

      {/* Grid of 4 media cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((media) => {
          const config = mediaConfigMap[media.media_type] || {
            name: media.media_type,
            icon: "category",
            bgColor: "var(--color-surface-container-high)",
            textColor: "var(--color-on-surface-variant)",
          };

          const gainPercent = `+${Math.round(media.avg_knowledge_gain)}%`;

          return (
            <div
              key={media.media_type}
              className="p-4 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-outline-variant/35"
              style={{
                backgroundColor: "var(--color-surface-container-lowest)",
              }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105"
                style={{
                  backgroundColor: config.bgColor,
                  color: config.textColor,
                }}
              >
                <span className="material-symbols-outlined select-none" style={{ fontSize: "20px" }}>{config.icon}</span>
              </div>

              {/* Name */}
              <h4
                className="font-label-md text-label-md mb-2 truncate"
                style={{ color: "var(--color-on-surface)" }}
              >
                {config.name}
              </h4>

              {/* Stats */}
              <div className="flex items-end justify-between mt-3">
                <div>
                  <span
                    className="block font-label-sm text-label-sm mb-1 text-[11px]"
                    style={{ color: "var(--color-outline)" }}
                  >
                    Knowledge Gain
                  </span>
                  <span
                    className="font-headline-sm text-headline-sm flex items-center gap-0.5 font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {gainPercent}
                    {media.avg_knowledge_gain > 0 && (
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                        arrow_upward
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className="block font-label-sm text-label-sm mb-1 text-[11px]"
                    style={{ color: "var(--color-outline)" }}
                  >
                    Avg Score
                  </span>
                  <span
                    className="font-label-md text-label-md font-semibold"
                    style={{ color: "var(--color-on-surface-variant)" }}
                  >
                    {media.avg_knowledge_gain.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
