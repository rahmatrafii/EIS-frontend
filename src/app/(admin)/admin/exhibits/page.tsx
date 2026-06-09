// src/app/(admin)/admin/exhibits/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminExhibits } from "@/hooks/admin/useAdminExhibits";
import ExhibitTable from "@/components/admin/ExhibitTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ROUTES } from "@/constants/routes";
import { Spinner } from "@/components/ui/Spinner";

export default function ExhibitListPage() {
  const router = useRouter();

  const {
    exhibits,
    totalCount,
    isLoading,
    error,
    deactivatingId,
    deletingId,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    filters,
    updateFilters,
    availableZones,
    handleDeactivate,
    handleActivate,
    handleDelete,
    refetch,
  } = useAdminExhibits();

  // --- Deactivate/Activate modal state ---
  const [statusToggleTarget, setStatusToggleTarget] = useState<{
    id: number;
    name: string;
    isActive: boolean;
  } | null>(null);

  // --- Delete modal state ---
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  function openStatusToggleModal(exhibitId: number, exhibitName: string, isActive: boolean) {
    setStatusToggleTarget({ id: exhibitId, name: exhibitName, isActive });
  }

  async function confirmStatusToggle() {
    if (!statusToggleTarget) return;
    if (statusToggleTarget.isActive) {
      await handleDeactivate(statusToggleTarget.id);
    } else {
      await handleActivate(statusToggleTarget.id);
    }
    setStatusToggleTarget(null);
  }

  function openDeleteModal(exhibitId: number, exhibitName: string) {
    setDeleteTarget({ id: exhibitId, name: exhibitName });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget.id);
    setDeleteTarget(null);
  }

  // --- Navigation handlers ---
  function handleEdit(exhibitId: number) {
    router.push(`/admin/exhibits/${exhibitId}`);
  }

  function handleAddNew() {
    router.push("/admin/exhibits/new");
  }

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Spinner className="w-12 h-12 text-primary" />
        <p
          className="font-label-md text-label-md"
          style={{ color: "var(--color-on-surface)" }}
        >
          Memuat data kandang...
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
          Gagal memuat data kandang
        </p>
        <p
          className="font-body-sm text-body-sm"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          {error}
        </p>
        <button
          onClick={refetch}
          className="flex items-center gap-2 rounded-lg px-4 py-2 font-label-md text-label-md transition-colors"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
          }}
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
      {/* ────────────── Page Header ────────────── */}
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
                <Link
                  href={ROUTES.admin.dashboard}
                  className="transition-colors hover:text-primary font-semibold"
                >
                  ZooLogix Admin
                </Link>
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
                <span className="font-bold" style={{ color: "var(--color-primary)" }}>Exhibits</span>
              </li>
            </ol>
          </nav>

          {/* Title */}
          <h2
            className="font-headline-lg text-headline-lg font-bold tracking-tight"
            style={{ color: "var(--color-on-surface)" }}
          >
            Manajemen Kandang
          </h2>
          <p className="text-body-sm text-outline/80 mt-1">
            Lihat, tambahkan, edit, dan kelola informasi kandang beserta konten edukasi.
          </p>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,93,66,0.12)] cursor-pointer font-semibold shrink-0 self-start sm:self-auto"
          id="add-exhibit-button"
        >
          <span className="material-symbols-outlined select-none" style={{ fontSize: "20px" }}>
            add
          </span>
          <span className="font-label-md text-label-md">Tambah Kandang</span>
        </button>
      </div>

      {/* ────────────── Table ────────────── */}
      <ExhibitTable
        exhibits={exhibits}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        filters={filters}
        availableZones={availableZones}
        deactivatingId={deactivatingId}
        onFilterChange={updateFilters}
        onPageChange={setCurrentPage}
        onDeactivate={(id, name) => openStatusToggleModal(id, name, true)}
        onActivate={(id, name) => openStatusToggleModal(id, name, false)}
        onEdit={handleEdit}
        onDelete={openDeleteModal}
      />

      {/* ────────────── Deactivate/Activate Confirm Modal ────────────── */}
      <ConfirmModal
        isOpen={statusToggleTarget !== null}
        onClose={() => setStatusToggleTarget(null)}
        onConfirm={confirmStatusToggle}
        title={statusToggleTarget?.isActive ? "Nonaktifkan Kandang?" : "Aktifkan Kandang?"}
        description={
          statusToggleTarget?.isActive
            ? `Kandang <strong>${statusToggleTarget?.name ?? ""}</strong> akan disembunyikan dari aplikasi pengunjung. Aksi ini tidak menghapus data konten, dan kandang dapat diaktifkan kembali kapan saja.`
            : `Kandang <strong>${statusToggleTarget?.name ?? ""}</strong> akan ditampilkan kembali di aplikasi pengunjung.`
        }
        confirmLabel={statusToggleTarget?.isActive ? "Nonaktifkan" : "Aktifkan"}
        cancelLabel="Batal"
        variant={statusToggleTarget?.isActive ? "danger" : "primary"}
        isLoading={deactivatingId !== null}
      />

      {/* ────────────── Delete Confirm Modal ────────────── */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Kandang Permanen?"
        description={`Apakah Anda yakin ingin menghapus kandang <strong>${deleteTarget?.name ?? ""}</strong>? Semua data terkait (media, konten edukasi, kuis, dan data interaksi) akan dihapus secara permanen dari database. Aksi ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
        isLoading={deletingId !== null}
      />
    </div>
  );
}
