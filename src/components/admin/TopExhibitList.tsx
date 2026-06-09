// src/components/admin/TopExhibitList.tsx
"use client";

import type { TopExhibit } from "@/types/admin.types";

interface TopExhibitListProps {
  exhibits: TopExhibit[];
}

const getExhibitImage = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("harimau"))
    return "https://images.unsplash.com/photo-1549366021-9f761d450615?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
  if (lower.includes("gajah"))
    return "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
  if (lower.includes("orangutan"))
    return "https://images.unsplash.com/photo-1540324155974-7523202daa3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
  if (lower.includes("komodo"))
    return "https://images.unsplash.com/photo-1629851411546-17b0d778d9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
  if (lower.includes("singa"))
    return "https://images.unsplash.com/photo-1546182990-dffeafbe841d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
  return "https://images.unsplash.com/photo-1474511320723-9a56873571b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
};

const getRankBadge = (index: number) => {
  const gradients: Record<number, string> = {
    0: "linear-gradient(135deg, #FFE066 0%, #F5B041 100%)", // Gold
    1: "linear-gradient(135deg, #F2F4F4 0%, #BDC3C7 100%)", // Silver
    2: "linear-gradient(135deg, #EDBB99 0%, #CA6F1E 100%)", // Bronze
  };

  if (index > 2) return null;

  return (
    <div
      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce-subtle"
      style={{
        background: gradients[index],
        border: "2px solid var(--color-surface-container-lowest)",
      }}
    >
      <span className="material-symbols-outlined text-white fill-icon" style={{ fontSize: "12px" }}>
        star
      </span>
    </div>
  );
};

export default function TopExhibitList({ exhibits }: TopExhibitListProps) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col"
      style={{
        backgroundColor: "var(--color-surface-container-lowest)",
        border: "1px solid rgba(189,201,193,0.35)",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3
          className="font-headline-sm text-headline-sm"
          style={{ color: "var(--color-on-surface)" }}
        >
          Top Kandang Terpopuler
        </h3>
        <button
          className="font-label-sm text-label-sm font-semibold hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          Lihat Semua
        </button>
      </div>

      {/* Exhibit List */}
      <div className="flex-1 flex flex-col gap-2">
        {exhibits.map((exhibit, index) => (
          <div
            key={exhibit.exhibit_id}
            className="group/item flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-outline-variant/20 hover:bg-surface-container-low transition-all duration-200"
          >
            {/* Image with Rank Badge */}
            <div className="relative shrink-0">
              <div className="overflow-hidden rounded-xl w-14 h-14 shadow-sm border border-outline-variant/10">
                <img
                  src={getExhibitImage(exhibit.exhibit_name)}
                  alt={exhibit.exhibit_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                />
              </div>
              {getRankBadge(index)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4
                className="font-label-md text-label-md truncate"
                style={{ color: "var(--color-on-surface)" }}
              >
                {exhibit.exhibit_name}
              </h4>
              <span
                className="font-label-sm text-label-sm block mt-0.5 text-outline/80"
              >
                Rata-rata: {Math.round(exhibit.avg_duration / 60)}m per kunjungan
              </span>
            </div>

            {/* Stats */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-label-sm font-semibold text-[11px]"
                style={{
                  backgroundColor: "var(--color-surface-container)",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                  timer
                </span>
                {Math.round(exhibit.avg_duration)}s
              </div>
              <div
                className="font-label-sm text-label-sm font-bold"
                style={{ color: "var(--color-tertiary)" }}
              >
                #{index + 1}
              </div>
            </div>
          </div>
        ))}

        {exhibits.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p
              className="font-body-sm text-body-sm"
              style={{ color: "var(--color-outline)" }}
            >
              Belum ada data kandang
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
