// src/app/(admin)/admin/quizzes/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminQuizzes } from "@/hooks/admin/useAdminQuizzes";
import QuizTable from "@/components/admin/QuizTable";
import QuizPreviewModal from "@/components/admin/QuizPreviewModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Spinner } from "@/components/ui/Spinner";
import { deleteAdminQuiz } from "@/services/admin.service";
import { useToast } from "@/stores/ToastContext";
import { ROUTES } from "@/constants/routes";
import type { AdminQuiz } from "@/types/admin.types";

export default function QuizListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const {
    quizzes,
    totalCount,
    isLoading,
    error,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    filters,
    updateFilters,
    stats,
    refetch,
  } = useAdminQuizzes();

  // --- Preview Modal State ---
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<AdminQuiz | null>(null);

  function handleOpenPreview(quiz: AdminQuiz) {
    setSelectedQuiz(quiz);
    setIsPreviewOpen(true);
  }

  function handleClosePreview() {
    setIsPreviewOpen(false);
    setSelectedQuiz(null);
  }

  // --- Delete Modal State ---
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<AdminQuiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleOpenDelete(quiz: AdminQuiz) {
    setQuizToDelete(quiz);
    setIsDeleteOpen(true);
  }

  function handleCloseDelete() {
    setIsDeleteOpen(false);
    setQuizToDelete(null);
  }

  async function handleConfirmDelete() {
    if (!quizToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteAdminQuiz(quizToDelete.id);
      if (result.success) {
        toast.success(result.data.message || "Kuis berhasil dihapus.");
        handleCloseDelete();
        refetch();
      } else {
        toast.error(result.error.message || "Gagal menghapus kuis.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Terjadi kesalahan saat menghapus kuis.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCreateNewQuiz() {
    router.push(ROUTES.admin.quizBuilder("new"));
  }

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Spinner className="h-12 w-12 text-primary" />
        <p
          className="font-label-md text-label-md"
          style={{ color: "var(--color-on-surface)" }}
        >
          Memuat data kuis...
        </p>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "48px", color: "var(--color-error)" }}
        >
          error_outline
        </span>
        <p
          className="font-label-md text-label-md"
          style={{ color: "var(--color-on-surface)" }}
        >
          Gagal memuat data kuis
        </p>
        <p
          className="font-body-sm text-body-sm"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          {error}
        </p>
        <button
          onClick={refetch}
          className="flex items-center gap-2 rounded-lg px-4 py-2 font-label-md text-label-md transition-colors bg-primary text-on-primary hover:bg-opacity-90 active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            refresh
          </span>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ────────────── Page Header & Breadcrumb ────────────── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex font-label-sm text-label-sm"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            <ol className="inline-flex items-center gap-2">
              <li className="inline-flex items-center">
                <a
                  href={ROUTES.admin.dashboard}
                  className="transition-colors hover:text-primary font-semibold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  ZooLogix Admin
                </a>
              </li>
              <li>
                <span
                  className="material-symbols-outlined text-outline/50 select-none"
                  style={{ fontSize: "14px" }}
                >
                  chevron_right
                </span>
              </li>
              <li aria-current="page">
                <span className="font-bold" style={{ color: "var(--color-primary)" }}>Kuis</span>
              </li>
            </ol>
          </nav>

          {/* Title */}
          <h2
            className="font-headline-lg text-headline-lg font-bold tracking-tight"
            style={{ color: "var(--color-on-surface)" }}
          >
            Manajemen Kuis
          </h2>
          <p className="text-body-sm text-outline/80 mt-1">
            Kelola kuesioner pengetahuan satwa untuk pengunjung.
          </p>
        </div>

        {/* Add Button */}
        <button
          onClick={handleCreateNewQuiz}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,93,66,0.12)] cursor-pointer font-semibold shrink-0 self-start sm:self-auto"
          id="add-quiz-button"
        >
          <span className="material-symbols-outlined select-none" style={{ fontSize: "20px" }}>
            add
          </span>
          <span className="font-label-md text-label-md">Buat Kuis Baru</span>
        </button>
      </div>

      {/* ────────────── Stats Grid ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Kuis Awal */}
        <div
          className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] bg-surface-container-lowest"
          style={{
            border: "1px solid rgba(189,201,193,0.35)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div
            className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1]"
            style={{ backgroundColor: "#3b82f6" }}
          />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant font-semibold tracking-wider uppercase mb-1">
                Kuis Awal
              </p>
              <h3 className="font-headline-xl text-[30px] font-bold leading-none text-on-surface">
                {stats.PRE_ZOO}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>psychology</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
              PRE_ZOO
            </span>
            {stats.PRE_ZOO === 0 && (
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200/30">
                Belum ada
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Kuis Akhir */}
        <div
          className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] bg-surface-container-lowest"
          style={{
            border: "1px solid rgba(189,201,193,0.35)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div
            className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1]"
            style={{ backgroundColor: "#10b981" }}
          />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant font-semibold tracking-wider uppercase mb-1">
                Kuis Akhir
              </p>
              <h3 className="font-headline-xl text-[30px] font-bold leading-none text-on-surface">
                {stats.POST_ZOO}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>emoji_events</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
              POST_ZOO
            </span>
            {stats.POST_ZOO === 0 && (
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/30">
                Belum ada
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Retensi H+7 */}
        <div
          className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] bg-surface-container-lowest"
          style={{
            border: "1px solid rgba(189,201,193,0.35)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div
            className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1]"
            style={{ backgroundColor: "#8b5cf6" }}
          />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant font-semibold tracking-wider uppercase mb-1">
                Retensi H+7
              </p>
              <h3 className="font-headline-xl text-[30px] font-bold leading-none text-on-surface">
                {stats.RETENTION_1W}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>event_repeat</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/50">
              RETENTION_1W
            </span>
            {stats.RETENTION_1W === 0 && (
              <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded border border-purple-200/30">
                Belum ada
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Retensi H+30 */}
        <div
          className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] bg-surface-container-lowest"
          style={{
            border: "1px solid rgba(189,201,193,0.35)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div
            className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1]"
            style={{ backgroundColor: "#f97316" }}
          />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant font-semibold tracking-wider uppercase mb-1">
                Retensi H+30
              </p>
              <h3 className="font-headline-xl text-[30px] font-bold leading-none text-on-surface">
                {stats.RETENTION_1M}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>history_toggle_off</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/50">
              RETENTION_1M
            </span>
            {stats.RETENTION_1M === 0 && (
              <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded border border-orange-200/30">
                Belum ada
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ────────────── Quiz Table ────────────── */}
      <QuizTable
        quizzes={quizzes}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        filters={filters}
        onFilterChange={updateFilters}
        onPageChange={setCurrentPage}
        onPreview={handleOpenPreview}
        onDelete={handleOpenDelete}
      />

      {/* ────────────── Quiz Preview Modal ────────────── */}
      <QuizPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        quiz={selectedQuiz}
      />

      {/* ────────────── Confirm Delete Quiz Modal ────────────── */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Hapus Kuis"
        description={`Apakah Anda yakin ingin menghapus kuis <strong>"${quizToDelete?.title}"</strong>? Semua data soal dalam kuis ini serta riwayat pengerjaan terkait akan dihapus secara permanen.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
