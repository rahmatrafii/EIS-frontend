// src/components/visitor/LabModal.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { X, ChevronRight, Gamepad2, Layers, HelpCircle } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { getVisitorLabGames } from "@/services/track.service";
import type { AdminLabGame } from "@/types/admin.types";
import { MediaBottomSheet } from "./MediaBottomSheet";

interface LabModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibitName: string;
}

export function LabModal({ isOpen, onClose, exhibitName }: LabModalProps) {
  const router = useRouter();
  const params = useParams();

  const exhibitId = (params?.exhibit_id as string) ?? "";
  const [games, setGames] = useState<AdminLabGame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && exhibitId) {
      setLoading(true);
      getVisitorLabGames(Number(exhibitId))
        .then((res) => {
          if (res.success) {
            setGames(res.data);
          }
        })
        .catch((err) => console.error("Gagal mengambil game lab visitor:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, exhibitId]);

  const customHeader = (
    <header className="px-edge-margin pb-stack-md shrink-0 flex items-center justify-between border-b border-outline-variant/10 select-none">
      <div>
        <h1 className="font-plus-jakarta-sans text-lg font-black text-on-surface uppercase tracking-wider">Interactive Lab</h1>
        <p className="font-inter text-xs text-on-surface-variant font-medium mt-0.5">{exhibitName}</p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close Modal"
        className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors cursor-pointer active:scale-95"
      >
        <X className="w-5 h-5" />
      </button>
    </header>
  );

  return (
    <MediaBottomSheet isOpen={isOpen} onClose={onClose} customHeader={customHeader}>
      <div className="space-y-stack-md pt-6">
        <p className="font-body-main text-body-main text-on-surface-variant mb-4 select-none">
          Pilih jenis game untuk memulai.
        </p>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-body-main text-on-surface-variant text-sm font-medium">Memuat daftar game...</span>
          </div>
        ) : games.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant text-body-main italic select-none">
            Belum ada game interaktif untuk kandang ini.
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => {
              const icon =
                game.gameType === "DRAG_DROP" ? (
                  <Gamepad2 className="w-6 h-6" />
                ) : game.gameType === "MATCHING" ? (
                  <Layers className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                );

              const gameTypeLabel =
                game.gameType === "DRAG_DROP"
                  ? "Drag & Drop"
                  : game.gameType === "MATCHING"
                  ? "Pasangkan"
                  : "Pilihan Bergambar";

              const containerColor =
                game.gameType === "DRAG_DROP"
                  ? "bg-secondary-container text-on-secondary-container border border-secondary/20"
                  : game.gameType === "MATCHING"
                  ? "bg-surface-variant text-on-surface-variant border border-outline-variant/10"
                  : "bg-primary-container text-on-primary-container border border-primary/20";

              return (
                <button
                  key={game.id}
                  onClick={() => {
                    onClose();
                    router.push(`${ROUTES.exhibit.lab(exhibitId)}?gameId=${game.id}`);
                  }}
                  className="w-full bg-white/70 hover:bg-white rounded-2xl p-4 flex items-center gap-4.5 text-left border border-outline-variant/15 hover:border-primary/25 hover:shadow-md transition-all active:scale-[0.98] group cursor-pointer"
                >
                  <div className={`w-14 h-14 rounded-2xl ${containerColor} flex items-center justify-center shrink-0 shadow-inner`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-plus-jakarta-sans text-[15px] font-black text-on-surface">{game.title}</h3>
                    <p className="font-inter text-[11px] text-on-surface-variant mt-0.5 font-semibold">{gameTypeLabel}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MediaBottomSheet>
  );
}
