// src/hooks/admin/useAdminLabGames.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/stores/ToastContext";
import {
  getLabGames,
  createLabGame,
  updateLabGame,
  deleteLabGame,
} from "@/services/admin.service";
import type { AdminLabGame } from "@/types/admin.types";

export function useAdminLabGames(exhibitId: number) {
  const [labGames, setLabGames] = useState<AdminLabGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operation loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<number | null>(null);

  const { toast } = useToast();

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getLabGames(exhibitId);
      if (result.success) {
        setLabGames(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memuat game lab.");
    } finally {
      setIsLoading(false);
    }
  }, [exhibitId]);

  useEffect(() => {
    if (exhibitId) {
      fetchGames();
    }
  }, [exhibitId, fetchGames]);

  const handleCreateGame = async (payload: {
    ageCategory: "CHILD" | "TEEN" | "ADULT" | "ALL";
    gameType: "DRAG_DROP" | "MATCHING" | "PICTURE_CHOICE";
    title: string;
    gameConfig: any;
  }) => {
    setIsSaving(true);
    try {
      const result = await createLabGame({
        exhibitId,
        ...payload,
      });

      if (result.success) {
        toast.success("Game lab berhasil dibuat.");
        await fetchGames();
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal membuat game lab.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGame = async (
    gameId: number,
    payload: {
      ageCategory?: "CHILD" | "TEEN" | "ADULT" | "ALL";
      gameType?: "DRAG_DROP" | "MATCHING" | "PICTURE_CHOICE";
      title?: string;
      gameConfig?: any;
    }
  ) => {
    setIsSaving(true);
    try {
      const result = await updateLabGame(gameId, { ...payload, exhibitId });

      if (result.success) {
        toast.success("Game lab berhasil diperbarui.");
        await fetchGames();
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui game lab.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGame = async (gameId: number) => {
    setIsDeleting(gameId);
    try {
      const result = await deleteLabGame(gameId);

      if (result.success) {
        toast.success("Game lab berhasil dihapus.");
        await fetchGames();
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus game lab.");
      return false;
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDuplicateGame = async (game: AdminLabGame) => {
    setIsDuplicating(game.id);
    try {
      const duplicatedConfig = JSON.parse(JSON.stringify(game.gameConfig));
      const result = await createLabGame({
        exhibitId,
        ageCategory: game.ageCategory,
        gameType: game.gameType,
        title: `[Salinan] ${game.title}`,
        gameConfig: duplicatedConfig,
      });

      if (result.success) {
        toast.success("Game lab berhasil diduplikat.");
        await fetchGames();
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menduplikat game lab.");
      return false;
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleToggleActive = async (gameId: number, currentStatus: boolean) => {
    // Optimistic update
    setLabGames((prev) =>
      prev.map((game) =>
        game.id === gameId ? { ...game, isActive: !currentStatus } : game
      )
    );

    try {
      const result = await updateLabGame(gameId, { isActive: !currentStatus });

      if (result.success) {
        toast.success(
          `Game lab berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}.`
        );
      } else {
        toast.error(result.error.message);
        // Revert status
        setLabGames((prev) =>
          prev.map((game) =>
            game.id === gameId ? { ...game, isActive: currentStatus } : game
          )
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengubah status aktif game.");
      // Revert status
      setLabGames((prev) =>
        prev.map((game) =>
          game.id === gameId ? { ...game, isActive: currentStatus } : game
        )
      );
    }
  };

  return {
    labGames,
    isLoading,
    error,
    isSaving,
    isDeleting,
    isDuplicating,
    refetch: fetchGames,
    createGame: handleCreateGame,
    updateGame: handleUpdateGame,
    deleteGame: handleDeleteGame,
    toggleActive: handleToggleActive,
    duplicateGame: handleDuplicateGame,
  };
}
