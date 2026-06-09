// src/app/(admin)/admin/analytics/visitors/page.tsx
"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { useToast } from "@/stores/ToastContext";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { getDashboardAnalytics, getVisitorList } from "@/services/analytics.service";

// ==========================================
// TYPES
// ==========================================
interface VisitorRow {
  id: string;
  name: string;
  email: string;
  initials: string;
  category: "CHILD" | "TEEN" | "ADULT";
  lastVisit: string;
  visits: number;
  eisScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
}

interface AgePerformance {
  avgEisScore: number;
  visitorsCount: number;
  knowledgeGain: number;
  favoriteMedia: string;
  emoji: string;
}

interface PeriodData {
  summary: {
    totalVisitors: number;
    avgEisScore: number;
    mostFrequentGrade: string;
    mostFrequentGradeCount: number;
    change: string;
    changeType: "up" | "down";
  };
  distribution: { name: string; visitors: number }[];
  grades: { name: string; count: number; bg: string; text: string; border: string }[];
  ageCategoryPerformance: {
    CHILD: AgePerformance;
    TEEN: AgePerformance;
    ADULT: AgePerformance;
  };
}

export default function VisitorAnalyticsPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [timePeriod, setTimePeriod] = useState<"TODAY" | "LAST_7_DAYS" | "THIS_MONTH">("LAST_7_DAYS");

  // Filter & Table States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // API states
  const [visitorList, setVisitorList] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const getDateRange = (period: "TODAY" | "LAST_7_DAYS" | "THIS_MONTH") => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const dateTo = formatDate(now);
    let dateFrom = dateTo;

    if (period === "LAST_7_DAYS") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      dateFrom = formatDate(past);
    } else if (period === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFrom = formatDate(firstDay);
    }
    return { dateFrom, dateTo };
  };

  const loadVisitorData = async (period: "TODAY" | "LAST_7_DAYS" | "THIS_MONTH") => {
    setIsLoading(true);
    try {
      const { dateFrom, dateTo } = getDateRange(period);
      
      const [dashRes, listRes] = await Promise.all([
        getDashboardAnalytics({ date_from: dateFrom, date_to: dateTo }),
        getVisitorList({ date_from: dateFrom, date_to: dateTo })
      ]);

      if (dashRes.success) {
        setDashboardData(dashRes.data);
      }
      if (listRes.success) {
        const formattedList = listRes.data.map((item: any) => {
          let formattedDate = "-";
          if (item.lastVisit) {
            try {
               const d = new Date(item.lastVisit);
               formattedDate = d.toLocaleDateString("id-ID", {
                 day: "2-digit",
                 month: "short",
                 year: "numeric"
               });
            } catch (e) {
               console.error("Error formatting date:", e);
            }
          }
          const nameParts = item.name.split(" ");
          const initials = nameParts.map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();

          return {
            ...item,
            initials,
            lastVisit: formattedDate
          };
        });
        setVisitorList(formattedList);
      } else {
        toast.error("Gagal memuat daftar pengunjung: " + (listRes.error?.message || ""));
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisitorData(timePeriod);
  }, [timePeriod]);

  const handlePeriodChange = (period: "TODAY" | "LAST_7_DAYS" | "THIS_MONTH") => {
    setTimePeriod(period);
    toast.success(`Menampilkan data analitik untuk ${period === "TODAY" ? "Hari Ini" : period === "LAST_7_DAYS" ? "7 Hari Terakhir" : "Bulan Ini"}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleGradeChange = (value: string) => {
    setSelectedGrade(value);
    setCurrentPage(1);
  };

  // Filter logic
  const activeVisitorList = visitorList;
  const filteredVisitors = activeVisitorList.filter((visitor) => {
    const matchesSearch =
      visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || visitor.category === selectedCategory;
    const matchesGrade =
      selectedGrade === "ALL" || visitor.grade === selectedGrade;
    return matchesSearch && matchesCategory && matchesGrade;
  });

  // Pagination logic
  const itemsPerPage = 10;
  const totalItems = filteredVisitors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentVisitors = filteredVisitors.slice(startIndex, endIndex);

  // Export CSV
  const handleExportCSV = () => {
    toast.success("Memulai pengunduhan data pengunjung (CSV)...");
    const headers = "Name,Email,Category,Last Visit,Visits,EIS Score,Grade\n";
    const rows = filteredVisitors
      .map(
        (v: any) =>
          `"${v.name}","${v.email}","${v.category}","${v.lastVisit}",${v.visits},${v.eisScore},"${v.grade}"`
      )
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `visitor_analytics_${timePeriod.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grade Counts
  const gradeCounts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  activeVisitorList.forEach((visitor) => {
    if (gradeCounts[visitor.grade] !== undefined) {
      gradeCounts[visitor.grade]++;
    }
  });

  let mostFrequentGrade = "B";
  let mostFrequentGradeCount = 0;
  Object.entries(gradeCounts).forEach(([grade, count]) => {
    if (count > mostFrequentGradeCount) {
      mostFrequentGrade = grade;
      mostFrequentGradeCount = count;
    }
  });

  const grades = [
    { name: "S", count: gradeCounts.S, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    { name: "A", count: gradeCounts.A, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    { name: "B", count: gradeCounts.B, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    { name: "C", count: gradeCounts.C, bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    { name: "D", count: gradeCounts.D, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  ];

  // Distribution buckets
  const buckets = [
    { name: "0-10", visitors: 0 },
    { name: "11-20", visitors: 0 },
    { name: "21-30", visitors: 0 },
    { name: "31-40", visitors: 0 },
    { name: "41-50", visitors: 0 },
    { name: "51-60", visitors: 0 },
    { name: "61-70", visitors: 0 },
    { name: "71-80", visitors: 0 },
    { name: "81-90", visitors: 0 },
    { name: "91-100", visitors: 0 },
  ];

  activeVisitorList.forEach((visitor) => {
    const score = visitor.eisScore || 0;
    let bucketIndex = Math.min(9, Math.floor((score - 1) / 10));
    if (score <= 0) bucketIndex = 0;
    buckets[bucketIndex].visitors++;
  });

  // Age category performance mapping
  const childVisitors = activeVisitorList.filter(v => v.category === "CHILD");
  const teenVisitors = activeVisitorList.filter(v => v.category === "TEEN");
  const adultVisitors = activeVisitorList.filter(v => v.category === "ADULT");

  const getAgeCategoryData = (cat: string) => {
    return dashboardData?.age_category_performance?.find((x: any) => x.age_category === cat);
  };

  const translateFavoriteMedia = (media: string | null | undefined, defaultValue: string) => {
    if (!media) return defaultValue;
    switch (media) {
      case "AUDIO":
        return "Audio Guide";
      case "VIDEO":
        return "Interactive Video";
      case "IMAGE_INFOGRAPHIC":
        return "Info Plaques";
      case "INTERACTIVE_LAB":
        return "Interactive Screen";
      default:
        return media;
    }
  };

  const ageCategoryPerformance = {
    CHILD: {
      avgEisScore: getAgeCategoryData("CHILD")?.avg_eis_score || Math.round(childVisitors.reduce((acc, curr) => acc + curr.eisScore, 0) / (childVisitors.length || 1)),
      visitorsCount: childVisitors.length,
      knowledgeGain: typeof getAgeCategoryData("CHILD")?.avg_knowledge_gain === 'number' ? Math.round(getAgeCategoryData("CHILD").avg_knowledge_gain) : 45,
      favoriteMedia: translateFavoriteMedia(getAgeCategoryData("CHILD")?.favorite_media, "Interactive Screen"),
      emoji: "🧒",
    },
    TEEN: {
      avgEisScore: getAgeCategoryData("TEEN")?.avg_eis_score || Math.round(teenVisitors.reduce((acc, curr) => acc + curr.eisScore, 0) / (teenVisitors.length || 1)),
      visitorsCount: teenVisitors.length,
      knowledgeGain: typeof getAgeCategoryData("TEEN")?.avg_knowledge_gain === 'number' ? Math.round(getAgeCategoryData("TEEN").avg_knowledge_gain) : 60,
      favoriteMedia: translateFavoriteMedia(getAgeCategoryData("TEEN")?.favorite_media, "Mobile App"),
      emoji: "🧑",
    },
    ADULT: {
      avgEisScore: getAgeCategoryData("ADULT")?.avg_eis_score || Math.round(adultVisitors.reduce((acc, curr) => acc + curr.eisScore, 0) / (adultVisitors.length || 1)),
      visitorsCount: adultVisitors.length,
      knowledgeGain: typeof getAgeCategoryData("ADULT")?.avg_knowledge_gain === 'number' ? Math.round(getAgeCategoryData("ADULT").avg_knowledge_gain) : 35,
      favoriteMedia: translateFavoriteMedia(getAgeCategoryData("ADULT")?.favorite_media, "Info Plaques"),
      emoji: "👤",
    },
  };

  const currentData = {
    summary: {
      totalVisitors: dashboardData?.summary?.total_visitors || activeVisitorList.length,
      avgEisScore: dashboardData?.summary?.avg_eis_score || 0,
      mostFrequentGrade,
      mostFrequentGradeCount,
      change: "+12.5% vs periode lalu",
      changeType: "up" as "up" | "down",
    },
    distribution: buckets,
    grades,
    ageCategoryPerformance,
  };

  // Helper function to dynamically locate bucket for vertical average line
  const getBucketForScore = (score: number) => {
    if (score <= 10) return "0-10";
    if (score <= 20) return "11-20";
    if (score <= 30) return "21-30";
    if (score <= 40) return "31-40";
    if (score <= 50) return "41-50";
    if (score <= 60) return "51-60";
    if (score <= 70) return "61-70";
    if (score <= 80) return "71-80";
    if (score <= 90) return "81-90";
    return "91-100";
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="flex flex-col gap-1">
          <div
            className="flex items-center gap-2 font-label-sm text-label-sm"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            <span className="hover:text-primary transition-colors cursor-pointer select-none">
              Analytics
            </span>
            <span className="material-symbols-outlined text-outline/50 select-none" style={{ fontSize: "14px" }}>
              chevron_right
            </span>
            <span className="font-bold select-none" style={{ color: "var(--color-primary)" }}>
              Pengunjung
            </span>
          </div>
          <h2
            className="font-headline-lg text-headline-lg font-bold tracking-tight"
            style={{ color: "var(--color-on-surface)" }}
          >
            Visitor Analytics
          </h2>
          <p
            className="font-body-sm text-body-sm text-outline/80 mt-1"
          >
            Tinjauan komprehensif tentang keterlibatan pengunjung dan metrik edukasi.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex gap-2">
          <select
            value={timePeriod}
            onChange={(e) => handlePeriodChange(e.target.value as "TODAY" | "LAST_7_DAYS" | "THIS_MONTH")}
            className="border border-outline-variant/30 rounded-xl px-4 py-2.5 font-label-md text-label-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none cursor-pointer shadow-sm"
            style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
          >
            <option value="TODAY">Hari ini</option>
            <option value="LAST_7_DAYS">7 Hari Terakhir</option>
            <option value="THIS_MONTH">Bulan Ini</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="border border-outline-variant/30 text-on-surface px-4 py-2.5 rounded-xl font-label-md text-label-md hover:bg-surface-container-low transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
          >
            <span className="material-symbols-outlined text-[18px] select-none">download</span>
            Ekspor
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-outline-variant/20 gap-6">
        <Link
          href={ROUTES.admin.analyticsExhibits}
          className="pb-3 text-label-md font-bold transition-all relative border-b-2 border-transparent text-on-surface-variant hover:text-primary"
        >
          Analitik Kandang
        </Link>
        <Link
          href={ROUTES.admin.analyticsVisitors}
          className="pb-3 text-label-md font-bold transition-all relative border-b-2 text-primary border-primary"
        >
          Analitik Pengunjung
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Spinner className="w-12 h-12 text-primary" />
          <p
            className="font-label-md text-label-md"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            Memuat data analitik pengunjung...
          </p>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric Card 1 */}
            <div
              className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)]"
              style={{
                backgroundColor: "var(--color-surface-container-lowest)",
                border: "1px solid rgba(189,201,193,0.35)",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div 
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-[0.06] bg-primary transition-opacity duration-300 group-hover:opacity-[0.1]"
              />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="font-label-sm text-label-sm font-semibold tracking-wider uppercase mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
                    Total Visitors
                  </p>
                  <h3
                    className="font-headline-xl text-[32px] font-bold leading-none"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    {currentData.summary.totalVisitors.toLocaleString("id-ID")}
                  </h3>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-primary"
                  style={{ backgroundColor: "rgba(0, 101, 44, 0.06)" }}
                >
                  <span className="material-symbols-outlined select-none" style={{ fontSize: "20px" }}>group</span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-primary relative z-10">
                <span className="material-symbols-outlined text-[16px] select-none">trending_up</span>
                <span className="font-label-sm text-label-sm font-semibold">{currentData.summary.change}</span>
              </div>
            </div>

            {/* Metric Card 2 */}
            <div
              className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)]"
              style={{
                backgroundColor: "var(--color-surface-container-lowest)",
                border: "1px solid rgba(189,201,193,0.35)",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div 
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-[0.06] bg-secondary transition-opacity duration-300 group-hover:opacity-[0.1]"
              />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="font-label-sm text-label-sm font-semibold tracking-wider uppercase mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
                    Avg EIS Score
                  </p>
                  <h3
                    className="font-headline-xl text-[32px] font-bold leading-none flex items-baseline gap-1.5"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    {currentData.summary.avgEisScore}
                    <span className="font-headline-sm text-headline-sm font-semibold" style={{ color: "var(--color-outline)" }}>
                      /100
                    </span>
                  </h3>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-secondary"
                  style={{ backgroundColor: "rgba(43, 105, 84, 0.06)" }}
                >
                  <span className="material-symbols-outlined select-none" style={{ fontSize: "20px" }}>school</span>
                </div>
              </div>
              <div
                className="mt-5 w-full h-2 rounded-full overflow-hidden relative z-10"
                style={{ backgroundColor: "var(--color-surface-container-high)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${currentData.summary.avgEisScore}%`,
                    backgroundColor: "var(--color-primary)",
                  }}
                />
              </div>
            </div>

            {/* Metric Card 3 */}
            <div
              className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)]"
              style={{
                backgroundColor: "var(--color-surface-container-lowest)",
                border: "1px solid rgba(189,201,193,0.35)",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div 
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-[0.06] bg-tertiary transition-opacity duration-300 group-hover:opacity-[0.1]"
              />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="font-label-sm text-label-sm font-semibold tracking-wider uppercase mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
                    Most Frequent Grade
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3
                      className="font-headline-xl text-[32px] font-bold leading-none"
                      style={{ color: "var(--color-on-surface)" }}
                    >
                      {currentData.summary.mostFrequentGrade}
                    </h3>
                    <span className="font-body-sm text-body-sm font-semibold" style={{ color: "var(--color-outline)" }}>
                      ({currentData.summary.mostFrequentGradeCount} visitors)
                    </span>
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-tertiary"
                  style={{ backgroundColor: "rgba(151, 52, 74, 0.06)" }}
                >
                  <span className="material-symbols-outlined select-none" style={{ fontSize: "20px" }}>military_tech</span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 relative z-10" style={{ color: "var(--color-on-surface-variant)" }}>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500/80 animate-pulse" />
                <span className="font-label-sm text-label-sm font-semibold">Solid understanding</span>
              </div>
            </div>
          </div>

          {/* Two-Column Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: EIS Score Distribution */}
            <div
              className="rounded-2xl p-6 border flex flex-col"
              style={{
                backgroundColor: "var(--color-surface-container-lowest)",
                border: "1px solid rgba(189,201,193,0.35)",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3
                  className="font-headline-sm text-headline-sm"
                  style={{ color: "var(--color-on-surface)" }}
                >
                  Distribusi EIS Score
                </h3>
              </div>

              {/* BarChart */}
              {activeVisitorList.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-surface-container-low/20 min-h-[360px] my-auto">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2 select-none">
                    bar_chart
                  </span>
                  <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                    Belum Ada Data Distribusi EIS
                  </p>
                  <p className="font-body-sm text-body-sm text-outline mt-1 max-w-xs mx-auto">
                    Distribusi skor evaluasi sistem akan tampil setelah pengunjung menyelesaikan evaluasi edukasi.
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-72 w-full relative">
                    {isMounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={currentData.distribution}
                          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="4 4"
                            vertical={false}
                            stroke="rgba(189,201,193,0.25)"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{
                              fill: "var(--color-outline)",
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{
                              fill: "var(--color-outline)",
                              fontSize: 12,
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "var(--color-surface-container-low)", opacity: 0.4 }}
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div 
                                    className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                                    style={{ fontFamily: "var(--font-work-sans), sans-serif" }}
                                  >
                                    <p className="font-label-sm text-on-surface-variant font-bold mb-1.5 uppercase tracking-wide">Rentang: {label}</p>
                                    <p className="font-body-sm text-primary flex items-center gap-1.5 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-primary-container" />
                                      Pengunjung: {payload[0]?.value}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="visitors" radius={[6, 6, 0, 0]} barSize={24}>
                            {currentData.distribution.map((entry: any, index: number) => {
                              let fill = "rgba(59, 130, 246, 0.75)"; // Default blue
                              if (index < 4) fill = "rgba(239, 68, 68, 0.75)"; // Red-ish for low
                              else if (index < 6) fill = "rgba(249, 115, 22, 0.75)"; // Orange
                              else if (index < 8) fill = "rgba(59, 130, 246, 0.75)"; // Blue
                              else if (index === 8) fill = "rgba(34, 197, 94, 0.75)"; // Green
                              else fill = "rgba(234, 179, 8, 0.75)"; // Yellow for S
                              return <Cell key={`cell-${index}`} fill={fill} />;
                            })}
                          </Bar>
                          <ReferenceLine
                            x={getBucketForScore(currentData.summary.avgEisScore)}
                            stroke="var(--color-primary)"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                            label={{
                              value: `Avg: ${currentData.summary.avgEisScore}`,
                              fill: "var(--color-primary)",
                              position: "top",
                              fontWeight: "bold",
                              fontSize: 11,
                            }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full bg-surface-container animate-pulse rounded-xl" />
                    )}
                  </div>

                  {/* Grade Chips */}
                  <div
                    className="mt-6 pt-4 grid grid-cols-5 gap-3"
                    style={{ borderTop: "1px solid rgba(189,201,193,0.15)" }}
                  >
                    {currentData.grades.map((grade: any) => {
                      let bgStyle = "rgba(234, 179, 8, 0.08)";
                      let textStyle = "text-amber-700";
                      let borderStyle = "border-amber-500/20";
                      
                      if (grade.name === "A") {
                        bgStyle = "rgba(34, 197, 94, 0.08)";
                        textStyle = "text-emerald-700";
                        borderStyle = "border-emerald-500/20";
                      } else if (grade.name === "B") {
                        bgStyle = "rgba(59, 130, 246, 0.08)";
                        textStyle = "text-blue-700";
                        borderStyle = "border-blue-500/20";
                      } else if (grade.name === "C") {
                        bgStyle = "rgba(249, 115, 22, 0.08)";
                        textStyle = "text-orange-700";
                        borderStyle = "border-orange-500/20";
                      } else if (grade.name === "D") {
                        bgStyle = "rgba(239, 68, 68, 0.08)";
                        textStyle = "text-red-700";
                        borderStyle = "border-red-500/20";
                      }

                      return (
                        <div
                          key={grade.name}
                          className={cn(
                            "flex flex-col items-center p-2 rounded-xl border text-center transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]",
                            textStyle,
                            borderStyle
                          )}
                          style={{ backgroundColor: bgStyle }}
                        >
                          <span className="font-headline-sm text-headline-sm font-bold">{grade.name}</span>
                          <span className="font-label-sm text-label-sm mt-0.5 font-bold">{grade.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Age Category Performance */}
            <div
              className="rounded-2xl p-6 border flex flex-col"
              style={{
                backgroundColor: "var(--color-surface-container-lowest)",
                border: "1px solid rgba(189,201,193,0.35)",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3
                  className="font-headline-sm text-headline-sm"
                  style={{ color: "var(--color-on-surface)" }}
                >
                  Performa per Kategori Usia
                </h3>
              </div>

              {activeVisitorList.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant/40 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-surface-container-low/20 min-h-[300px] my-auto">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2 select-none">
                    group
                  </span>
                  <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                    Belum Ada Data Kategori Usia
                  </p>
                  <p className="font-body-sm text-body-sm text-outline mt-1 max-w-xs mx-auto">
                    Statistik per kategori usia akan terisi setelah data kunjungan tercatat dalam database.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  {(Object.keys(currentData.ageCategoryPerformance) as Array<"CHILD" | "TEEN" | "ADULT">).map((key: "CHILD" | "TEEN" | "ADULT") => {
                    const category = currentData.ageCategoryPerformance[key];
                    let bgCard = "rgba(59, 130, 246, 0.03)";
                    let borderCard = "border-blue-500/10";
                    let textTitle = "text-blue-900";
                    let bgProgress = "bg-blue-600";
                    let badgeClass = "bg-blue-100/80 text-blue-800 border-blue-200/20";
                    let textLabelClass = "text-blue-700/60";

                    if (key === "TEEN") {
                      bgCard = "rgba(168, 85, 247, 0.03)";
                      borderCard = "border-purple-500/10";
                      textTitle = "text-purple-900";
                      bgProgress = "bg-purple-600";
                      badgeClass = "bg-purple-100/80 text-purple-800 border-purple-200/20";
                      textLabelClass = "text-purple-700/60";
                    } else if (key === "ADULT") {
                      bgCard = "rgba(34, 197, 94, 0.03)";
                      borderCard = "border-emerald-500/10";
                      textTitle = "text-emerald-900";
                      bgProgress = "bg-emerald-600";
                      badgeClass = "bg-emerald-100/80 text-emerald-800 border-emerald-200/20";
                      textLabelClass = "text-emerald-700/60";
                    }

                    return (
                      <div
                        key={key}
                        className={cn(
                          "rounded-xl p-4 border hover:shadow-[0_8px_20px_rgba(0,0,0,0.015)] transition-all duration-300",
                          borderCard
                        )}
                        style={{ backgroundColor: bgCard }}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl select-none">{category.emoji}</span>
                            <h4 className={cn("font-label-md text-label-md font-bold uppercase tracking-wider", textTitle)}>{key}</h4>
                          </div>
                          <span className={cn("px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold border", badgeClass)}>
                            {category.visitorsCount.toLocaleString("id-ID")} Visitors
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3.5">
                          <div>
                            <p className={cn("font-label-sm text-label-sm font-semibold text-[11px]", textLabelClass)}>AVG EIS</p>
                            <p className="font-body-md text-body-md font-bold text-on-surface">{category.avgEisScore}</p>
                          </div>
                          <div>
                            <p className={cn("font-label-sm text-label-sm font-semibold text-[11px]", textLabelClass)}>KNOWLEDGE GAIN</p>
                            <p className="font-body-md text-body-md font-bold text-on-surface">+{category.knowledgeGain}%</p>
                          </div>
                          <div>
                            <p className={cn("font-label-sm text-label-sm font-semibold text-[11px]", textLabelClass)}>FAV MEDIA</p>
                            <p className="font-body-sm text-body-sm font-bold text-on-surface truncate max-w-full" title={category.favoriteMedia}>
                              {category.favoriteMedia}
                            </p>
                          </div>
                        </div>

                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-1000", bgProgress)}
                            style={{ width: `${category.avgEisScore}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Visitor Directory Table */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface-container-lowest)",
              borderColor: "rgba(189,201,193,0.35)",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
            }}
          >
            {/* Table Header & Filters */}
            <div className="p-6" style={{ borderBottom: "1px solid rgba(189,201,193,0.15)" }}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <h3
                    className="font-headline-sm text-headline-sm"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    Daftar Pengunjung
                  </h3>
                  <span
                    className="px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold"
                    style={{
                      backgroundColor: "var(--color-surface-container)",
                      color: "var(--color-on-surface-variant)",
                    }}
                  >
                    {totalItems.toLocaleString("id-ID")} Total
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[280px]">
                  <span
                    className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] select-none"
                    style={{ color: "var(--color-outline)" }}
                  >
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-xl pl-10 pr-4 py-2.5 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all outline-none border border-outline-variant/30"
                    style={{
                      backgroundColor: "var(--color-surface-container-lowest)",
                      color: "var(--color-on-surface)",
                    }}
                    placeholder="Cari nama atau email..."
                    type="text"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="border border-outline-variant/30 rounded-xl px-4 py-2.5 font-label-md text-label-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none cursor-pointer"
                  style={{
                    backgroundColor: "var(--color-surface-container-lowest)",
                  }}
                >
                  <option value="ALL">Semua Usia</option>
                  <option value="CHILD">CHILD</option>
                  <option value="TEEN">TEEN</option>
                  <option value="ADULT">ADULT</option>
                </select>

                {/* Grade Filter */}
                <select
                  value={selectedGrade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="border border-outline-variant/30 rounded-xl px-4 py-2.5 font-label-md text-label-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none cursor-pointer"
                  style={{
                    backgroundColor: "var(--color-surface-container-lowest)",
                  }}
                >
                  <option value="ALL">Semua Grade</option>
                  <option value="S">Grade S</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                </select>
              </div>
            </div>

            {/* Table Data */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface-container-low)" }}>
                    <th
                      className="px-6 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-semibold"
                      style={{
                        borderBottom: "1px solid rgba(189,201,193,0.15)",
                        color: "var(--color-on-surface-variant)",
                      }}
                    >
                      Nama
                    </th>
                    <th
                      className="px-6 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-semibold"
                      style={{
                        borderBottom: "1px solid rgba(189,201,193,0.15)",
                        color: "var(--color-on-surface-variant)",
                      }}
                    >
                      Kategori
                    </th>
                    <th
                      className="px-6 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-semibold"
                      style={{
                        borderBottom: "1px solid rgba(189,201,193,0.15)",
                        color: "var(--color-on-surface-variant)",
                      }}
                    >
                      Kunjungan Terakhir
                    </th>
                    <th
                      className="px-6 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-semibold text-center"
                      style={{
                        borderBottom: "1px solid rgba(189,201,193,0.15)",
                        color: "var(--color-on-surface-variant)",
                      }}
                    >
                      Kunjungan
                    </th>
                    <th
                      className="px-6 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-semibold text-center"
                      style={{
                        borderBottom: "1px solid rgba(189,201,193,0.15)",
                        color: "var(--color-on-surface-variant)",
                      }}
                    >
                      Skor EIS
                    </th>
                    <th
                      className="px-6 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-semibold text-center"
                      style={{
                        borderBottom: "1px solid rgba(189,201,193,0.15)",
                        color: "var(--color-on-surface-variant)",
                      }}
                    >
                      Grade
                    </th>
                    <th
                      className="px-6 py-3.5"
                      style={{ borderBottom: "1px solid rgba(189,201,193,0.15)" }}
                    />
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm">
                  {activeVisitorList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 px-4">
                        <div className="border-2 border-dashed border-outline-variant/50 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-surface-container-low/20">
                          <span className="material-symbols-outlined text-4xl text-outline mb-2 select-none">
                            person_search
                          </span>
                          <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                            Belum Ada Data Pengunjung
                          </p>
                          <p className="font-body-sm text-body-sm text-outline mt-1 max-w-sm mx-auto">
                            Daftar pengunjung dan hasil evaluasi sistem akan muncul setelah pengunjung melakukan aktivitas di kebun binatang.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : currentVisitors.length > 0 ? (
                    currentVisitors.map((visitor: any) => {
                      let categoryClass = "bg-green-50 text-green-700 border-green-200/30";
                      let avatarBg = "bg-primary-container/20 text-primary";
                      let scoreColor = "text-primary";

                      if (visitor.category === "CHILD") {
                        categoryClass = "bg-blue-50 text-blue-700 border-blue-200/30";
                        avatarBg = "bg-blue-100 text-blue-700";
                      } else if (visitor.category === "TEEN") {
                        categoryClass = "bg-purple-50 text-purple-700 border-purple-200/30";
                        avatarBg = "bg-purple-100 text-purple-700";
                      }

                      if (visitor.grade === "C") {
                        scoreColor = "text-orange-600";
                      } else if (visitor.grade === "D") {
                        scoreColor = "text-red-600";
                      } else if (visitor.grade === "S") {
                        scoreColor = "text-amber-600";
                      }

                      let gradeBadgeBg = "bg-blue-100/80 text-blue-700 border border-blue-200/20";
                      if (visitor.grade === "S") gradeBadgeBg = "bg-amber-100/80 text-amber-700 border border-amber-200/20";
                      else if (visitor.grade === "A") gradeBadgeBg = "bg-green-100/80 text-green-700 border border-green-200/20";
                      else if (visitor.grade === "C") gradeBadgeBg = "bg-orange-100/80 text-orange-700 border border-orange-200/20";
                      else if (visitor.grade === "D") gradeBadgeBg = "bg-red-100/80 text-red-700 border border-red-200/20";

                      return (
                        <tr
                          key={visitor.id}
                          className="hover:bg-surface-container-low/30 transition-colors group"
                          style={{ borderBottom: "1px solid rgba(189,201,193,0.15)" }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm", avatarBg)}>
                                {visitor.initials}
                              </div>
                              <div>
                                <p className="font-label-md text-label-md text-on-surface font-semibold">
                                  {visitor.name}
                                </p>
                                <p className="font-body-sm text-[12px] text-on-surface-variant/80">
                                  {visitor.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("inline-block px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold border", categoryClass)}>
                              {visitor.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant">
                            {visitor.lastVisit}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-2.5 py-0.5 bg-surface-container rounded-full font-label-sm text-label-sm font-semibold">
                              {visitor.visits}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn("font-label-md text-label-md font-bold", scoreColor)}>
                              {visitor.eisScore}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs", gradeBadgeBg)}>
                              {visitor.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={ROUTES.admin.visitorDetail(visitor.id)}
                              className="text-primary hover:text-emerald-700 font-label-md text-label-md inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity font-semibold"
                            >
                              Detail{" "}
                              <span className="material-symbols-outlined text-[16px]">
                                arrow_forward
                              </span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                        Tidak ada pengunjung yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="p-4 flex justify-between items-center"
                style={{
                  borderTop: "1px solid rgba(189,201,193,0.15)",
                  backgroundColor: "var(--color-surface-container-lowest)",
                }}
              >
                <span className="font-body-sm text-body-sm text-outline/80">
                  Menampilkan {startIndex + 1} sampai {endIndex} dari {totalItems} entri
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 border border-outline-variant/30 rounded-xl bg-white text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed font-label-sm text-label-sm transition-all cursor-pointer shadow-sm"
                  >
                    Sebelumnya
                  </button>

                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNum = index + 1;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-xl font-label-sm text-label-sm transition-all cursor-pointer border",
                          isActive
                            ? "bg-primary text-white border-primary shadow-[0_4px_10px_rgba(0,101,44,0.15)]"
                            : "bg-white text-on-surface border-outline-variant/30 hover:bg-surface-container-low shadow-sm"
                        )}
                        style={isActive ? { backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" } : {}}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 border border-outline-variant/30 rounded-xl bg-white text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed font-label-sm text-label-sm transition-all cursor-pointer shadow-sm"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom padding for scroll */}
      <div className="h-6" />
    </div>
  );
}
