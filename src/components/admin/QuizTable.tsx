// src/components/admin/QuizTable.tsx
"use client";

import type { AdminQuiz, QuizFilters } from "@/types/admin.types";
import { useToast } from "@/stores/ToastContext";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

interface QuizTableProps {
  quizzes: AdminQuiz[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  filters: QuizFilters;
  onFilterChange: (partial: Partial<QuizFilters>) => void;
  onPageChange: (page: number) => void;
  onPreview: (quiz: AdminQuiz) => void;
  onDelete: (quiz: AdminQuiz) => void;
}

export default function QuizTable({
  quizzes,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  filters,
  onFilterChange,
  onPageChange,
  onPreview,
  onDelete,
}: QuizTableProps) {
  const { toast } = useToast();
  const router = useRouter();

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // --- Badge styling helper for Quiz Type ---
  function getQuizTypeBadge(type: string) {
    switch (type) {
      case "PRE_ZOO":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-200/30">
            Kuis Awal
          </span>
        );
      case "POST_ZOO":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-200/30">
            Kuis Akhir
          </span>
        );
      case "RETENTION_1W":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 border border-purple-200/30">
            Retensi H+7
          </span>
        );
      case "RETENTION_1M":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-700 border border-orange-200/30">
            Retensi H+30
          </span>
        );
      default:
        return null;
    }
  }

  // --- Age category label with emoji ---
  function getAgeCategoryBadge(cat: string) {
    let emoji = "🧑";
    let label = cat;
    let badgeClass = "bg-surface-container border border-outline-variant/50 text-on-surface-variant";

    switch (cat.toUpperCase()) {
      case "CHILD":
        emoji = "👦";
        label = "Anak-anak";
        badgeClass = "bg-pink-500/10 text-pink-700 border border-pink-200/30";
        break;
      case "TEEN":
        emoji = "🧑";
        label = "Remaja";
        badgeClass = "bg-indigo-500/10 text-indigo-700 border border-indigo-200/30";
        break;
      case "ADULT":
        emoji = "🧑";
        label = "Dewasa";
        badgeClass = "bg-teal-500/10 text-teal-700 border border-teal-200/30";
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
        <span className="text-[13px] leading-none select-none">{emoji}</span>
        <span>{label}</span>
      </span>
    );
  }

  // --- Scope layout helper ---
  function getScopeCell(scope: string, exhibitName?: string) {
    const isGlobal = scope.toUpperCase() === "GLOBAL";
    const iconName = isGlobal ? "public" : "map";
    const text = isGlobal ? "Global" : exhibitName || "Per Kandang";
    const badgeClass = isGlobal 
      ? "bg-sky-500/10 text-sky-700 border border-sky-200/30" 
      : "bg-amber-500/10 text-amber-700 border border-amber-200/30";

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
        <span className="material-symbols-outlined text-[13px] leading-none select-none font-bold">{iconName}</span>
        <span>{text}</span>
      </div>
    );
  }

  // --- Date formatter ---
  function formatDate(dateStr: string) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="space-y-6">
      {/* ────────────── Controls Card ────────────── */}
      <div
        className="rounded-xl p-4 bg-surface-container-lowest"
        style={{
          boxShadow: "0px 4px 20px rgba(0,0,0,0.03)",
          border: "1px solid rgba(189,201,193,0.3)",
        }}
        id="quiz-filters"
      >
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:max-w-xs flex-1">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 select-none text-outline"
              style={{ fontSize: "20px" }}
            >
              search
            </span>
            <input
              className="w-full rounded-xl py-2 pl-9 pr-4 font-body-sm text-body-sm transition-all bg-white border border-outline-variant/60 hover:border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-on-surface placeholder:text-outline/70"
              placeholder="Cari judul kuis..."
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              id="quiz-search-input"
            />
          </div>

          {/* Filters dropdowns */}
          <div className="w-full flex flex-col sm:flex-row gap-3 md:flex-1 md:justify-end">
            {/* Tipe Kuis */}
            <div className="relative w-full sm:w-44">
              <select
                className="w-full cursor-pointer appearance-none rounded-xl py-2 pl-4 pr-10 font-body-sm text-body-sm transition-all bg-white border border-outline-variant/60 hover:border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-on-surface"
                value={filters.quizType}
                onChange={(e) => onFilterChange({ quizType: e.target.value })}
                id="quiz-type-filter"
              >
                <option value="all">Semua Tipe</option>
                <option value="PRE_ZOO">Kuis Awal</option>
                <option value="POST_ZOO">Kuis Akhir</option>
                <option value="RETENTION_1W">Retensi H+7</option>
                <option value="RETENTION_1M">Retensi H+30</option>
              </select>
              <span
                className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-outline"
                style={{ fontSize: "20px" }}
              >
                expand_more
              </span>
            </div>

            {/* Target Usia */}
            <div className="relative w-full sm:w-44">
              <select
                className="w-full cursor-pointer appearance-none rounded-xl py-2 pl-4 pr-10 font-body-sm text-body-sm transition-all bg-white border border-outline-variant/60 hover:border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-on-surface"
                value={filters.ageCategory}
                onChange={(e) => onFilterChange({ ageCategory: e.target.value })}
                id="quiz-age-filter"
              >
                <option value="all">Semua Usia</option>
                <option value="child">Anak-anak</option>
                <option value="teen">Remaja</option>
                <option value="adult">Dewasa</option>
              </select>
              <span
                className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-outline"
                style={{ fontSize: "20px" }}
              >
                expand_more
              </span>
            </div>

            {/* Cakupan */}
            <div className="relative w-full sm:w-48">
              <select
                className="w-full cursor-pointer appearance-none rounded-xl py-2 pl-4 pr-10 font-body-sm text-body-sm transition-all bg-white border border-outline-variant/60 hover:border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-on-surface"
                value={filters.scope}
                onChange={(e) => onFilterChange({ scope: e.target.value })}
                id="quiz-scope-filter"
              >
                <option value="all">Semua Cakupan</option>
                <option value="global">Global</option>
                <option value="exhibit">Per Kandang</option>
              </select>
              <span
                className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-outline"
                style={{ fontSize: "20px" }}
              >
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────── Quiz Table Card ────────────── */}
      <div
        className="overflow-hidden rounded-2xl bg-surface-container-lowest"
        style={{
          boxShadow: "0px 4px 20px rgba(0,0,0,0.03)",
          border: "1px solid rgba(189,201,193,0.3)",
        }}
        id="quiz-table-card"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr
                className="bg-surface-container-low/50"
                style={{
                  borderBottom: "1px solid rgba(189,201,193,0.25)",
                }}
              >
                <th
                  className="px-6 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Judul Kuis
                </th>
                <th
                  className="px-4 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Tipe
                </th>
                <th
                  className="px-4 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Target Usia
                </th>
                <th
                  className="px-4 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Cakupan
                </th>
                <th
                  className="px-4 py-3.5 text-center font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Jml Soal
                </th>
                <th
                  className="px-4 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Dibuat Pada
                </th>
                <th
                  className="px-6 py-3.5 text-right font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm" style={{ color: "var(--color-on-surface)" }}>
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span
                        className="material-symbols-outlined select-none text-outline-variant"
                        style={{ fontSize: "48px" }}
                      >
                        search_off
                      </span>
                      <p
                        className="font-label-md text-label-md"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        Tidak ada kuis yang ditemukan
                      </p>
                      <p
                        className="font-body-sm text-body-sm text-outline"
                      >
                        Ubah kata pencarian atau bersihkan filter Anda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                quizzes.map((quiz) => (
                  <tr
                    key={quiz.id}
                    className="group border-b border-outline-variant/15 hover:bg-surface-container-low/35 transition-colors"
                  >
                    {/* Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all bg-primary/[0.06] text-primary border-primary/10"
                        >
                          <span
                            className="material-symbols-outlined select-none"
                            style={{ fontSize: "20px" }}
                          >
                            quiz
                          </span>
                        </div>
                        <div>
                          <p
                            className="font-label-md text-label-md font-semibold text-on-surface"
                          >
                            {quiz.title}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4">{getQuizTypeBadge(quiz.quizType)}</td>

                    {/* Target Usia */}
                    <td className="px-4 py-4">
                      {getAgeCategoryBadge(quiz.ageCategory)}
                    </td>

                    {/* Cakupan */}
                    <td className="px-4 py-4">
                      {getScopeCell(quiz.scope, quiz.exhibitName)}
                    </td>

                    {/* Jml Soal */}
                    <td className="px-4 py-4 text-center font-bold text-on-surface">
                      {quiz.questions.length}
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-4 text-on-surface-variant/90">
                      {formatDate(quiz.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/[0.08] rounded-lg transition-colors active:scale-95 cursor-pointer"
                          title="Edit Kuis"
                          onClick={() => router.push(ROUTES.admin.quizBuilder(quiz.id))}
                        >
                          <span className="material-symbols-outlined text-[20px] select-none">
                            edit_note
                          </span>
                        </button>
                        <button
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/[0.08] rounded-lg transition-colors active:scale-95 cursor-pointer"
                          title="Hapus Kuis"
                          onClick={() => onDelete(quiz)}
                        >
                          <span className="material-symbols-outlined text-[20px] select-none">
                            delete
                          </span>
                        </button>
                        <button
                          className="ml-1 px-3 py-1.5 font-semibold text-primary border border-primary/40 rounded-xl hover:bg-primary hover:text-on-primary hover:border-transparent transition-all active:scale-95 text-xs cursor-pointer shadow-sm"
                          onClick={() => onPreview(quiz)}
                        >
                          Lihat Soal
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ────────────── Pagination Footer ────────────── */}
        <div
          className="flex items-center justify-between px-6 py-3.5 bg-surface-container-lowest"
          style={{
            borderTop: "1px solid rgba(189,201,193,0.25)",
          }}
          id="quiz-pagination"
        >
          <span
            className="font-body-sm text-body-sm font-medium"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            Menampilkan <span className="font-semibold text-on-surface">{startItem}</span>-
            <span className="font-semibold text-on-surface">{endItem}</span> dari{" "}
            <span className="font-semibold text-on-surface">{totalCount}</span> kuis
          </span>
          <div className="flex gap-1.5">
            {/* Previous */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/60 text-outline hover:text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-outline cursor-pointer disabled:cursor-not-allowed"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <span
                className="material-symbols-outlined select-none"
                style={{ fontSize: "18px" }}
              >
                chevron_left
              </span>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isCurrentPage = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg font-label-sm font-semibold transition-all cursor-pointer ${
                    isCurrentPage
                      ? "bg-primary text-on-primary shadow-sm"
                      : "border border-outline-variant/60 text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Next */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/60 text-outline hover:text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-outline cursor-pointer disabled:cursor-not-allowed"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <span
                className="material-symbols-outlined select-none"
                style={{ fontSize: "18px" }}
              >
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
