// src/components/admin/ExhibitTable.tsx
"use client";

import type { AdminExhibit, ExhibitFilters, ContentStatus } from "@/types/admin.types";

// ─────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────
interface ExhibitTableProps {
  exhibits: AdminExhibit[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  filters: ExhibitFilters;
  availableZones: string[];
  deactivatingId: number | null;
  onFilterChange: (partial: Partial<ExhibitFilters>) => void;
  onPageChange: (page: number) => void;
  onDeactivate: (exhibitId: number, exhibitName: string) => void;
  onActivate: (exhibitId: number, exhibitName: string) => void;
  onEdit: (exhibitId: number) => void;
  onDelete: (exhibitId: number, exhibitName: string) => void;
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

/** Hitung completion: berapa dari 6 item (3 text + 3 media) yang sudah lengkap */
function getCompletion(cs: AdminExhibit["content_status"]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = 6;
  let completed = 0;
  const categories: ("CHILD" | "TEEN" | "ADULT")[] = ["CHILD", "TEEN", "ADULT"];
  for (const cat of categories) {
    if (cs[cat].hasText) completed++;
    if (cs[cat].hasMedia) completed++;
  }
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

/** Icon material untuk zona */
function getZoneIcon(zoneName: string): string {
  const lower = zoneName.toLowerCase();
  if (lower.includes("mamalia")) return "sound_detection_dog_barking";
  if (lower.includes("primata")) return "emoji_nature";
  if (lower.includes("reptil")) return "bug_report";
  if (lower.includes("unggas") || lower.includes("burung")) return "raven";
  return "pets";
}

/** Format tanggal ke format Indonesia */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────

/** Ikon status konten: ✅ atau ❌ */
function StatusIcon({ status }: { status: ContentStatus }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {/* Text status (T) */}
      <span
        className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 font-label-sm text-[10px] font-bold uppercase transition-all select-none"
        style={{
          backgroundColor: status.hasText
            ? "rgba(16,185,129,0.08)"
            : "rgba(239,68,68,0.08)",
          color: status.hasText
            ? "rgb(16,185,129)"
            : "rgb(239,68,68)",
          border: status.hasText
            ? "1px solid rgba(16,185,129,0.2)"
            : "1px solid rgba(239,68,68,0.2)",
        }}
        title={status.hasText ? "Teks Lengkap" : "Teks Belum Ada"}
      >
        <span>T</span>
        <span className="material-symbols-outlined" style={{ fontSize: "10px", fontWeight: "bold" }}>
          {status.hasText ? "check" : "close"}
        </span>
      </span>
      {/* Media status (M) */}
      <span
        className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 font-label-sm text-[10px] font-bold uppercase transition-all select-none"
        style={{
          backgroundColor: status.hasMedia
            ? "rgba(16,185,129,0.08)"
            : "rgba(239,68,68,0.08)",
          color: status.hasMedia
            ? "rgb(16,185,129)"
            : "rgb(239,68,68)",
          border: status.hasMedia
            ? "1px solid rgba(16,185,129,0.2)"
            : "1px solid rgba(239,68,68,0.2)",
        }}
        title={status.hasMedia ? "Media Lengkap" : "Media Belum Ada"}
      >
        <span>M</span>
        <span className="material-symbols-outlined" style={{ fontSize: "10px", fontWeight: "bold" }}>
          {status.hasMedia ? "check" : "close"}
        </span>
      </span>
    </div>
  );
}

/** Progress circle completion */
function CompletionCircle({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percentage = Math.round((completed / total) * 100);
  const isComplete = completed === total;
  const isLow = completed <= 1;

  // Modern premium palette: Emerald (complete), Amber (partial), Rose (low)
  const strokeColor = isComplete
    ? "rgb(16, 185, 129)"
    : isLow
      ? "rgb(244, 63, 94)"
      : "rgb(245, 158, 11)";

  const bgTrack = "rgba(189,201,193,0.25)";
  const radius = 14;
  const strokeDashoffset = 87.96 - (87.96 * percentage) / 100;

  return (
    <div className="flex items-center justify-center">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          {/* Background Track */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke={bgTrack}
            strokeWidth="3.5"
          />
          {/* Active Progress */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeDasharray="87.96"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span
            className="font-bold tracking-tight text-[11px] leading-none select-none"
            style={{
              color: isComplete
                ? "rgb(16, 185, 129)"
                : isLow
                  ? "rgb(244, 63, 94)"
                  : "rgb(245, 158, 11)",
            }}
          >
            {completed}/{total}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────
export default function ExhibitTable({
  exhibits,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  filters,
  availableZones,
  onFilterChange,
  onPageChange,
  onDeactivate,
  onActivate,
  onEdit,
  onDelete,
}: ExhibitTableProps) {
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-6">
      {/* ────────────── Filter Controls Card ────────────── */}
      <div
        className="rounded-xl p-4 bg-surface-container-lowest"
        style={{
          boxShadow: "0px 4px 20px rgba(0,0,0,0.03)",
          border: "1px solid rgba(189,201,193,0.3)",
        }}
        id="exhibit-filters"
      >
        <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
          {/* Left: Search + Zone */}
          <div className="flex w-full flex-1 gap-4">
            {/* Search */}
            <div className="relative max-w-sm flex-1">
              <span
                className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 select-none"
                style={{ color: "var(--color-outline)", fontSize: "20px" }}
              >
                search
              </span>
              <input
                className="w-full rounded-xl py-2 pl-10 pr-4 font-body-sm text-body-sm transition-all bg-white border border-outline-variant/60 hover:border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                style={{
                  color: "var(--color-on-surface)",
                }}
                placeholder="Cari nama kandang..."
                type="text"
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                id="exhibit-search-input"
              />
            </div>

            {/* Zone Dropdown */}
            <div className="relative w-44">
              <select
                className="w-full cursor-pointer appearance-none rounded-xl py-2 pl-4 pr-10 font-body-sm text-body-sm transition-all bg-white border border-outline-variant/60 hover:border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                style={{
                  color: "var(--color-on-surface)",
                }}
                value={filters.zone}
                onChange={(e) => onFilterChange({ zone: e.target.value })}
                id="exhibit-zone-filter"
              >
                <option value="">Semua Zona</option>
                {availableZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none"
                style={{ color: "var(--color-outline)", fontSize: "20px" }}
              >
                expand_more
              </span>
            </div>
          </div>

          {/* Right: Status Segmented Control */}
          <div
            className="flex w-full rounded-xl p-1 lg:w-auto bg-surface-container-low border border-outline-variant/30"
            id="exhibit-status-filter"
          >
            {(
              [
                { value: "all", label: "Semua" },
                { value: "active", label: "Aktif" },
                { value: "inactive", label: "Nonaktif" },
              ] as const
            ).map((tab) => {
              const isActive = filters.status === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => onFilterChange({ status: tab.value })}
                  className="flex-1 rounded-lg px-5 py-1.5 font-label-sm text-label-sm font-semibold transition-all lg:flex-none cursor-pointer"
                  style={{
                    backgroundColor: isActive
                      ? "var(--color-surface-container-lowest)"
                      : "transparent",
                    color: isActive
                      ? "var(--color-primary)"
                      : "var(--color-on-surface-variant)",
                    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                    border: isActive
                      ? "1px solid rgba(189,201,193,0.2)"
                      : "1px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ────────────── Exhibit Table Card ────────────── */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          backgroundColor: "var(--color-surface-container-lowest)",
          boxShadow: "0px 4px 20px rgba(0,0,0,0.03)",
          border: "1px solid rgba(189,201,193,0.3)",
        }}
        id="exhibit-table-card"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
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
                  Exhibit
                </th>
                <th
                  className="px-4 py-3.5 text-center font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Child (T/M)
                </th>
                <th
                  className="px-4 py-3.5 text-center font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Teen (T/M)
                </th>
                <th
                  className="px-4 py-3.5 text-center font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Adult (T/M)
                </th>
                <th
                  className="px-6 py-3.5 text-center font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Completion
                </th>
                <th
                  className="px-6 py-3.5 font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Created
                </th>
                <th
                  className="px-6 py-3.5 text-right font-label-sm text-label-sm uppercase tracking-wider font-bold"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm" style={{ color: "var(--color-on-surface)" }}>
              {exhibits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span
                        className="material-symbols-outlined select-none"
                        style={{ fontSize: "48px", color: "var(--color-outline-variant)" }}
                      >
                        search_off
                      </span>
                      <p
                        className="font-label-md text-label-md"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        Tidak ada kandang yang ditemukan
                      </p>
                      <p
                        className="font-body-sm text-body-sm"
                        style={{ color: "var(--color-outline)" }}
                      >
                        Coba ubah filter atau kata pencarian
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                exhibits.map((exhibit) => {
                  const completion = getCompletion(exhibit.content_status);
                  const icon = getZoneIcon(exhibit.zone_name);

                  return (
                    <tr
                      key={exhibit.id}
                      className={`group border-b border-outline-variant/15 hover:bg-surface-container-low/35 transition-colors ${
                        !exhibit.is_active ? "opacity-75" : ""
                      }`}
                    >
                      {/* Exhibit Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                              exhibit.is_active
                                ? "bg-primary/[0.06] text-primary border-primary/10"
                                : "bg-surface-container text-outline border-outline-variant/20"
                            }`}
                          >
                            <span
                              className="material-symbols-outlined select-none"
                              style={{ fontSize: "20px" }}
                            >
                              {icon}
                            </span>
                          </div>
                          <div>
                            <p
                              className="font-label-md text-label-md font-semibold"
                              style={{ color: "var(--color-on-surface)" }}
                            >
                              {exhibit.name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span
                                style={{
                                  color: "var(--color-on-surface-variant)",
                                  fontSize: "12px",
                                }}
                              >
                                {exhibit.zone_name}
                              </span>
                              <span
                                className="inline-block h-1 w-1 rounded-full"
                                style={{
                                  backgroundColor: "var(--color-outline-variant)",
                                }}
                              />
                              {exhibit.is_active ? (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-gray-500/10 text-gray-500 border border-gray-500/20">
                                  Nonaktif
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Child T/M */}
                      <td className="px-4 py-4 text-center align-middle">
                        <StatusIcon status={exhibit.content_status.CHILD} />
                      </td>

                      {/* Teen T/M */}
                      <td className="px-4 py-4 text-center align-middle">
                        <StatusIcon status={exhibit.content_status.TEEN} />
                      </td>

                      {/* Adult T/M */}
                      <td className="px-4 py-4 text-center align-middle">
                        <StatusIcon status={exhibit.content_status.ADULT} />
                      </td>

                      {/* Completion */}
                      <td className="px-6 py-4 text-center align-middle">
                        <CompletionCircle
                          completed={completion.completed}
                          total={completion.total}
                        />
                      </td>

                      {/* Created */}
                      <td
                        className="whitespace-nowrap px-6 py-4 font-medium"
                        style={{ color: "var(--color-on-surface-variant)" }}
                      >
                        {formatDate(exhibit.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {/* Edit Button */}
                          <button
                            className="rounded-xl p-2 text-outline hover:text-primary hover:bg-primary/10 transition-all active:scale-95 cursor-pointer"
                            title="Edit"
                            onClick={() => onEdit(exhibit.id)}
                          >
                            <span
                              className="material-symbols-outlined select-none"
                              style={{ fontSize: "18px" }}
                            >
                              edit
                            </span>
                          </button>

                          {/* Delete Button (Hapus) */}
                          <button
                            className="rounded-xl p-2 text-outline hover:text-error hover:bg-error/10 transition-all active:scale-95 cursor-pointer"
                            title="Hapus"
                            onClick={() => onDelete(exhibit.id, exhibit.name)}
                          >
                            <span
                              className="material-symbols-outlined select-none"
                              style={{ fontSize: "18px" }}
                            >
                              delete
                            </span>
                          </button>

                          {/* Status Toggle (Nonaktifkan / Aktifkan) */}
                          {exhibit.is_active ? (
                            <button
                              className="rounded-xl p-2 text-outline hover:text-on-surface-variant hover:bg-surface-container transition-all active:scale-95 cursor-pointer"
                              title="Nonaktifkan"
                              onClick={() => onDeactivate(exhibit.id, exhibit.name)}
                            >
                              <span
                                className="material-symbols-outlined select-none"
                                style={{ fontSize: "18px" }}
                              >
                                pause_circle
                              </span>
                            </button>
                          ) : (
                            <button
                              className="rounded-xl p-2 text-outline hover:text-primary hover:bg-primary/10 transition-all active:scale-95 cursor-pointer"
                              title="Aktifkan"
                              onClick={() => onActivate(exhibit.id, exhibit.name)}
                            >
                              <span
                                className="material-symbols-outlined select-none"
                                style={{ fontSize: "18px" }}
                              >
                                play_circle
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
          id="exhibit-pagination"
        >
          <span
            className="font-body-sm text-body-sm font-medium"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            Menampilkan <span className="font-semibold text-on-surface">{startItem}</span>-
            <span className="font-semibold text-on-surface">{endItem}</span> dari{" "}
            <span className="font-semibold text-on-surface">{totalCount}</span> kandang
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
