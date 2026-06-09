// src/hooks/admin/useAdminQuizzes.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getAdminQuizzes } from "@/services/admin.service";
import type { AdminQuiz, QuizFilters } from "@/types/admin.types";

const PAGE_SIZE = 5; // Menggunakan rekomendasi PAGE_SIZE = 5

export function useAdminQuizzes() {
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filter State ---
  const [filters, setFilters] = useState<QuizFilters>({
    search: "",
    quizType: "all",
    ageCategory: "all",
    scope: "all",
  });

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- Fetch Quizzes ---
  const loadQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminQuizzes();
      if (result.success) {
        setQuizzes(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memuat kuis.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  // --- Calculate Stats (Unfiltered total state of quizzes) ---
  const stats = useMemo(() => {
    const counts = {
      PRE_ZOO: 0,
      POST_ZOO: 0,
      RETENTION_1W: 0,
      RETENTION_1M: 0,
    };

    quizzes.forEach((q) => {
      if (q.quizType in counts) {
        counts[q.quizType as keyof typeof counts]++;
      }
    });

    return counts;
  }, [quizzes]);

  // --- Filtered Data ---
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      // 1. Search filter (matching title)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (!quiz.title.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. Quiz Type filter
      if (filters.quizType !== "all" && quiz.quizType !== filters.quizType) {
        return false;
      }

      // 3. Age Category filter (mockup uses child/teen/adult, database uses CHILD/TEEN/ADULT)
      if (filters.ageCategory !== "all") {
        if (quiz.ageCategory.toLowerCase() !== filters.ageCategory.toLowerCase()) {
          return false;
        }
      }

      // 4. Scope filter (mockup uses global/exhibit, database uses GLOBAL/EXHIBIT)
      if (filters.scope !== "all") {
        if (quiz.scope.toLowerCase() !== filters.scope.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [quizzes, filters]);

  // --- Pagination calculations ---
  const totalCount = filteredQuizzes.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const paginatedQuizzes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredQuizzes.slice(start, start + PAGE_SIZE);
  }, [filteredQuizzes, currentPage]);

  const updateFilters = useCallback((partial: Partial<QuizFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setCurrentPage(1);
  }, []);

  return {
    quizzes: paginatedQuizzes,
    allQuizzes: quizzes,
    totalCount,
    isLoading,
    error,
    currentPage,
    totalPages,
    pageSize: PAGE_SIZE,
    setCurrentPage,
    filters,
    updateFilters,
    stats,
    refetch: loadQuizzes,
  };
}
