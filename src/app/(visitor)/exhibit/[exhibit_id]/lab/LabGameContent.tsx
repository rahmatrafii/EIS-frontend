"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { submitLabLog, getVisitorLabGames } from "@/services/track.service";
import { Beaker } from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";
import { useToast } from "@/stores/ToastContext";
import { ROUTES } from "@/constants/routes";
import { DragDropGame } from "@/components/visitor/DragDropGame";
import { MatchingGame } from "@/components/visitor/MatchingGame";
import { PictureChoiceGame } from "@/components/visitor/PictureChoiceGame";
import type {
  AdminLabGame,
  DragDropConfig,
  MatchingConfig,
  PictureChoiceConfig,
} from "@/types/admin.types";

interface LabGameContentProps {
  exhibitId: string;
}

export function LabGameContent({ exhibitId }: LabGameContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");
  const { toast } = useToast();

  const [exhibitName, setExhibitName] = useState("Satwa");
  const [interactionId, setInteractionId] = useState<number | null>(null);
  
  const [games, setGames] = useState<AdminLabGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load exhibit data from sessionStorage on mount
  useEffect(() => {
    const storedExhibit = sessionStorage.getItem("eis_current_exhibit");
    const storedIntId = sessionStorage.getItem("eis_current_interaction_id");

    if (storedExhibit) {
      try {
        const parsed = JSON.parse(storedExhibit) as { name?: string };
        if (parsed.name) {
          setExhibitName(parsed.name);
        }
      } catch {
        // Ignore parse errors
      }
    }

    if (storedIntId) {
      setInteractionId(parseInt(storedIntId, 10));
    }
  }, []);

  // Fetch games on mount
  useEffect(() => {
    if (exhibitId) {
      setLoading(true);
      setError(null);
      getVisitorLabGames(Number(exhibitId))
        .then((res) => {
          if (res.success) {
            setGames(res.data);
          } else {
            setError(res.error.message || "Gagal memuat game");
          }
        })
        .catch((err) => {
          console.error(err);
          setError("Gagal memuat game");
        })
        .finally(() => setLoading(false));
    }
  }, [exhibitId]);

  // Find the selected game or use the first active game as fallback
  const selectedGame = gameId
    ? games.find((g) => g.id === Number(gameId))
    : games[0];

  // Handle game completion — submit lab log to backend
  async function handleGameComplete(score: number) {
    if (!interactionId || !selectedGame) return;

    try {
      await submitLabLog({
        interactionId,
        gameName: selectedGame.title,
        actionTaken: "COMPLETED",
        scoreAchieved: score,
      });
    } catch (err) {
      console.error("Gagal mengirim lab log:", err);
      toast.error("Gagal menyimpan skor game.");
    }
  }

  // Handle back navigation
  function handleBack() {
    router.push(ROUTES.exhibit.detail(exhibitId));
  }

  if (loading) {
    return <PageLoader text="Memuat game..." minHeight="min-h-screen" />;
  }

  if (error || games.length === 0 || !selectedGame) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#f7faf6] px-6 text-center relative select-none overflow-hidden">
        {/* Decorative Ambient Background Blobs */}
        <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
        <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

        <div className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2.5rem] p-8 backdrop-blur-lg flex flex-col items-center max-w-[340px] relative z-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 border border-primary/5 shadow-inner">
            <Beaker className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-plus-jakarta-sans text-lg font-black text-on-surface mb-2 tracking-tight">
            {error || "Tidak Ada Game Aktif"}
          </h2>
          <p className="font-inter text-xs text-on-surface-variant leading-relaxed max-w-sm mb-6 font-medium">
            Belum ada permainan lab interaktif yang aktif untuk kandang ini.
          </p>
          <button
            onClick={handleBack}
            className="w-full bg-gradient-to-r from-primary to-[#005c24] text-white py-4 rounded-full font-plus-jakarta-sans text-xs font-black tracking-widest uppercase flex items-center justify-center shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            Kembali ke Kandang
          </button>
        </div>
      </div>
    );
  }

  // Render game based on type
  if (selectedGame.gameType === "MATCHING") {
    return (
      <MatchingGame
        config={selectedGame.gameConfig as MatchingConfig}
        onComplete={handleGameComplete}
        onBack={handleBack}
      />
    );
  }

  if (selectedGame.gameType === "PICTURE_CHOICE") {
    return (
      <PictureChoiceGame
        config={selectedGame.gameConfig as PictureChoiceConfig}
        onComplete={handleGameComplete}
        onBack={handleBack}
      />
    );
  }

  // Fallback to DRAG_DROP
  return (
    <DragDropGame
      exhibitName={exhibitName}
      config={selectedGame.gameConfig as DragDropConfig}
      onComplete={handleGameComplete}
      onBack={handleBack}
    />
  );
}
