// src/hooks/admin/useAdminExhibitDetail.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/stores/ToastContext";
import {
  getAdminExhibitDetail,
  updateExhibitDetail,
  saveExhibitContent,
  deleteExhibitContent,
  deleteExhibitMedia,
} from "@/services/admin.service";
import type { AdminExhibitDetail } from "@/types/admin.types";

export function useAdminExhibitDetail(exhibitId: number) {
  const [exhibit, setExhibit] = useState<AdminExhibitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operation loading states
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isDeletingContent, setIsDeletingContent] = useState(false);
  const [isDeletingMedia, setIsDeletingMedia] = useState<number | null>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState("tab-info");

  const { toast } = useToast();

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getAdminExhibitDetail(exhibitId);
    if (result.success) {
      setExhibit(result.data);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  }, [exhibitId]);

  useEffect(() => {
    if (exhibitId) {
      loadDetail();
    }
  }, [exhibitId, loadDetail]);

  const handleUpdateInfo = async (
    name: string,
    zoneName: string,
    description: string,
    imageUrl?: string | null
  ) => {
    setIsSavingInfo(true);
    const result = await updateExhibitDetail(exhibitId, {
      name,
      zone_name: zoneName,
      description,
      image_url: imageUrl,
    });
    setIsSavingInfo(false);

    if (result.success) {
      toast.success("Perubahan informasi kandang berhasil disimpan.");
      setExhibit((prev) =>
        prev
          ? {
              ...prev,
              name: result.data.name,
              zone_name: result.data.zone_name,
              description: result.data.description,
              image_url: result.data.image_url,
            }
          : null
      );
      return true;
    } else {
      toast.error(result.error.message);
      return false;
    }
  };

  const handleSaveContent = async (
    ageCategory: "CHILD" | "TEEN" | "ADULT",
    contentTitle: string,
    contentBody: string
  ) => {
    setIsSavingContent(true);
    const result = await saveExhibitContent({
      exhibitId,
      ageCategory,
      contentTitle,
      contentBody,
    });
    setIsSavingContent(false);

    if (result.success) {
      toast.success("Materi edukasi berhasil disimpan.");
      await loadDetail(); // Refresh list to get updated updatedAt timestamps and flags
      return true;
    } else {
      toast.error(result.error.message);
      return false;
    }
  };

  const handleDeleteContent = async (ageCategory: "CHILD" | "TEEN" | "ADULT") => {
    setIsDeletingContent(true);
    const content = exhibit?.learningContent.find(
      (c) => c.ageCategory === ageCategory
    );
    if (!content || !content.id) {
      toast.error("Materi edukasi tidak ditemukan untuk dihapus.");
      setIsDeletingContent(false);
      return false;
    }

    const result = await deleteExhibitContent(content.id);
    setIsDeletingContent(false);

    if (result.success) {
      toast.success("Materi edukasi berhasil dihapus.");
      await loadDetail();
      return true;
    } else {
      toast.error(result.error.message);
      return false;
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    setIsDeletingMedia(mediaId);
    const result = await deleteExhibitMedia(mediaId);
    setIsDeletingMedia(null);

    if (result.success) {
      toast.success("Media berhasil dihapus.");
      await loadDetail();
      return true;
    } else {
      toast.error(result.error.message);
      return false;
    }
  };

  return {
    exhibit,
    isLoading,
    error,
    isSavingInfo,
    isSavingContent,
    isDeletingContent,
    isDeletingMedia,
    activeTab,
    setActiveTab,
    refetch: loadDetail,
    handleUpdateInfo,
    handleSaveContent,
    handleDeleteContent,
    handleDeleteMedia,
  };
}
