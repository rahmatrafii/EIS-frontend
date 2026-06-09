// src/hooks/admin/useAdminExhibits.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getAdminExhibits, deactivateExhibit, activateExhibit, hardDeleteExhibit } from "@/services/admin.service";
import { useToast } from "@/stores/ToastContext";
import type { AdminExhibit, ExhibitFilters } from "@/types/admin.types";

const PAGE_SIZE = 10;

export function useAdminExhibits() {
  // --- Data State ---
  const [exhibits, setExhibits] = useState<AdminExhibit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter State ---
  const [filters, setFilters] = useState<ExhibitFilters>({
    search: "",
    zone: "",
    status: "all",
  });

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- Deactivation State ---
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { toast } = useToast();

  // --- Fetch Data ---
  const loadExhibits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getAdminExhibits();
    if (result.success) {
      setExhibits(result.data);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadExhibits();
  }, [loadExhibits]);

  // --- Filtered Data ---
  const filteredExhibits = useMemo(() => {
    return exhibits.filter((ex) => {
      // Filter by search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !ex.name.toLowerCase().includes(q) &&
          !ex.zone_name.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // Filter by zone
      if (filters.zone && ex.zone_name !== filters.zone) return false;
      // Filter by status
      if (filters.status === "active" && !ex.is_active) return false;
      if (filters.status === "inactive" && ex.is_active) return false;
      return true;
    });
  }, [exhibits, filters]);

  // --- Pagination ---
  const totalPages = Math.max(1, Math.ceil(filteredExhibits.length / PAGE_SIZE));

  const paginatedExhibits = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredExhibits.slice(start, start + PAGE_SIZE);
  }, [filteredExhibits, currentPage]);

  // --- Unique zones for dropdown ---
  const availableZones = useMemo(() => {
    const zones = new Set(exhibits.map((ex) => ex.zone_name));
    return Array.from(zones).sort();
  }, [exhibits]);

  // --- Actions ---
  async function handleDeactivate(exhibitId: number) {
    setDeactivatingId(exhibitId);
    const result = await deactivateExhibit(exhibitId);
    if (result.success) {
      toast.success("Kandang berhasil dinonaktifkan.");
      await loadExhibits();
    } else {
      toast.error(result.error.message);
    }
    setDeactivatingId(null);
  }

  async function handleActivate(exhibitId: number) {
    setDeactivatingId(exhibitId);
    const result = await activateExhibit(exhibitId);
    if (result.success) {
      toast.success("Kandang berhasil diaktifkan.");
      await loadExhibits();
    } else {
      toast.error(result.error.message);
    }
    setDeactivatingId(null);
  }

  async function handleDelete(exhibitId: number) {
    setDeletingId(exhibitId);
    const result = await hardDeleteExhibit(exhibitId);
    if (result.success) {
      toast.success("Kandang berhasil dihapus secara permanen.");
      await loadExhibits();
    } else {
      toast.error(result.error.message);
    }
    setDeletingId(null);
  }

  function updateFilters(partial: Partial<ExhibitFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
    setCurrentPage(1);
  }

  return {
    exhibits: paginatedExhibits,
    allExhibits: filteredExhibits,
    totalCount: filteredExhibits.length,
    availableZones,
    isLoading,
    error,
    deactivatingId,
    deletingId,
    currentPage,
    totalPages,
    pageSize: PAGE_SIZE,
    setCurrentPage,
    filters,
    updateFilters,
    handleDeactivate,
    handleActivate,
    handleDelete,
    refetch: loadExhibits,
  };
}
