// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getDashboardAnalytics } from "@/services/analytics.service";
import { useToast } from "@/stores/ToastContext";
import type { DashboardAnalytics } from "@/types/admin.types";
import StatsCard from "@/components/admin/StatsCard";
import TrendChart from "@/components/admin/TrendChart";
import TopExhibitList from "@/components/admin/TopExhibitList";
import AgeCategoryChart from "@/components/admin/AgeCategoryChart";
import MediaEffectivenessGrid from "@/components/admin/MediaEffectivenessGrid";
import { Spinner } from "@/components/ui/Spinner";

// Mock trend data (backend doesn't provide daily trend yet)
const mockTrendData = [
  { name: "Mon", visitors: 900, eis: 65 },
  { name: "Tue", visitors: 1100, eis: 68 },
  { name: "Wed", visitors: 1050, eis: 70 },
  { name: "Thu", visitors: 1200, eis: 69 },
  { name: "Fri", visitors: 1400, eis: 74 },
  { name: "Sat", visitors: 2100, eis: 78 },
  { name: "Sun", visitors: 1800, eis: 75 },
];

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const result = await getDashboardAnalytics();
        if (result.success) {
          setDashboardData(result.data);
        } else {
          toast.error("Gagal mengambil data dashboard.");
        }
      } catch {
        toast.error("Terjadi kesalahan koneksi.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [toast]);

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner className="w-12 h-12 text-primary" />
        <p
          className="font-label-md text-label-md"
          style={{ color: "var(--color-on-surface)" }}
        >
          Memuat dashboard...
        </p>
      </div>
    );
  }

  const summary = dashboardData?.summary;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2" style={{ color: "var(--color-on-surface-variant)" }}>
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold select-none">
              ZooLogix
            </span>
            <span className="material-symbols-outlined text-outline/50 select-none" style={{ fontSize: "14px" }}>
              chevron_right
            </span>
            <span
              className="font-label-sm text-label-sm font-bold select-none"
              style={{ color: "var(--color-primary)" }}
            >
              Dashboard
            </span>
          </div>
          <h2
            className="font-headline-lg text-headline-lg tracking-tight font-bold"
            style={{ color: "var(--color-on-surface)" }}
          >
            Main Operations
          </h2>
          <p className="text-body-sm text-outline/80 mt-1">
            Selamat datang kembali! Berikut ringkasan operasional dan keterlibatan edukasi pengunjung hari ini.
          </p>
        </div>
        <div className="flex gap-3">
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
            style={{
              backgroundColor: "var(--color-surface-container-lowest)",
              color: "var(--color-on-surface)",
            }}
          >
            <span className="material-symbols-outlined text-primary select-none" style={{ fontSize: "18px" }}>
              calendar_today
            </span>
            <span className="font-label-md text-label-md font-semibold select-none">
              Hari ini, {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row — 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Total Visitors"
          value={summary?.total_visitors ?? 0}
          icon="groups"
          change="+12%"
          changeType="up"
          subtext={`vs last period`}
        />
        <StatsCard
          title="Avg EIS Score"
          value={Math.round(summary?.avg_eis_score ?? 0)}
          icon="psychology"
          change="+3%"
          changeType="up"
          suffix="/ 100"
        >
          {/* Progress Bar */}
          <div
            className="w-full h-2 rounded-full mt-3 overflow-hidden"
            style={{ backgroundColor: "var(--color-surface-container-high)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(summary?.avg_eis_score ?? 0, 100)}%`,
                backgroundColor: "var(--color-tertiary)",
              }}
            />
          </div>
        </StatsCard>
        <StatsCard
          title="Avg Duration"
          value={Math.round(summary?.avg_duration_minutes ?? 0)}
          icon="timer"
          change="-5%"
          changeType="down"
          suffix="m"
          subtext="Average time spent per visitor"
        />
        <StatsCard
          title="Active Sessions"
          value={summary?.active_sessions ?? 0}
          icon="devices"
          change="Live"
          changeType="live"
        >
          {/* Session Avatars */}
          {(summary?.active_sessions ?? 0) > 0 && (
            <div className="flex gap-1 mt-3">
              {(summary?.active_users ?? []).map((user, i) => {
                const initials = user.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const bgColors = ["rgba(4,120,87,0.2)", "rgba(0,93,62,0.2)", "rgba(43,105,84,0.2)"];
                const textColors = ["var(--color-primary-container)", "var(--color-tertiary)", "var(--color-secondary)"];
                return (
                  <div
                    key={user.id}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-label-sm"
                    style={{
                      backgroundColor: bgColors[i] ?? bgColors[2],
                      color: textColors[i] ?? textColors[2],
                      border: "2px solid var(--color-surface)",
                      marginLeft: i > 0 ? "-8px" : "0",
                    }}
                  >
                    {initials}
                  </div>
                );
              })}
              {(summary?.active_sessions ?? 0) > 3 && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-label-sm"
                  style={{
                    backgroundColor: "var(--color-surface-container-highest)",
                    color: "var(--color-on-surface-variant)",
                    border: "2px solid var(--color-surface)",
                    marginLeft: "-8px",
                  }}
                >
                  +{(summary?.active_sessions ?? 0) - 3}
                </div>
              )}
            </div>
          )}
        </StatsCard>
      </div>

      {/* Trend Chart — Full Width */}
      <TrendChart data={dashboardData?.trend || mockTrendData} />

      {/* Two Column: Top Exhibits + Age Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopExhibitList exhibits={dashboardData?.top_exhibits ?? []} />
        <AgeCategoryChart data={dashboardData?.age_category_performance ?? []} />
      </div>

      {/* Media Effectiveness — Full Width */}
      <MediaEffectivenessGrid data={dashboardData?.media_effectiveness ?? []} />
    </div>
  );
}
