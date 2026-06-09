"use client";

import { cn } from "@/lib/cn";
import { recordInteraction } from "@/services/track.service";

interface MediaGridProps {
  exhibitId: string;
  interactionId: number;
  onMediaClick: (type: "audio" | "video" | "infographic" | "lab") => void;
  className?: string;
}

export function MediaGrid({ exhibitId, interactionId, onMediaClick, className }: MediaGridProps) {
  async function handleMediaClick(type: "audio" | "video" | "infographic" | "lab") {
    // Determine the mapped mediaType expected by backend
    const mediaTypeMap: Record<string, "AUDIO" | "VIDEO" | "IMAGE_INFOGRAPHIC" | "INTERACTIVE_LAB"> = {
      audio: "AUDIO",
      video: "VIDEO",
      infographic: "IMAGE_INFOGRAPHIC",
      lab: "INTERACTIVE_LAB",
    };

    // Fire interaction log to backend (safely in background, do not block transition)
    try {
      await recordInteraction({
        interactionId,
        mediaType: mediaTypeMap[type],
      });
    } catch (err) {
      console.error("Gagal mencatat interaksi:", err);
    }

    // Call the parent callback to display the inline media player modal
    onMediaClick(type);
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3.5 mb-8 fade-in-up stagger-2", className)}>
      {/* Audio Card */}
      <button
        onClick={() => handleMediaClick("audio")}
        className="bg-white/60 hover:bg-white p-4.5 rounded-2xl flex flex-col gap-3.5 items-start border border-outline-variant/15 hover:border-primary/25 hover:shadow-md transition-all duration-300 text-left cursor-pointer w-full select-none active:scale-[0.97]"
      >
        <div className="w-11 h-11 rounded-2xl bg-orange-100/50 flex items-center justify-center text-orange-600 shadow-inner shrink-0 border border-orange-200/20">
          <span className="material-symbols-outlined font-variation-fill" style={{ fontVariationSettings: "'FILL' 1" }}>
            music_note
          </span>
        </div>
        <div>
          <div className="font-plus-jakarta-sans text-[14px] text-on-surface font-black">Audio</div>
          <div className="font-inter text-[11px] text-on-surface-variant font-medium mt-0.5">Dengar suaranya</div>
        </div>
      </button>

      {/* Video Card */}
      <button
        onClick={() => handleMediaClick("video")}
        className="bg-white/60 hover:bg-white p-4.5 rounded-2xl flex flex-col gap-3.5 items-start border border-outline-variant/15 hover:border-primary/25 hover:shadow-md transition-all duration-300 text-left cursor-pointer w-full select-none active:scale-[0.97]"
      >
        <div className="w-11 h-11 rounded-2xl bg-blue-100/50 flex items-center justify-center text-blue-600 shadow-inner shrink-0 border border-blue-200/20">
          <span className="material-symbols-outlined font-variation-fill" style={{ fontVariationSettings: "'FILL' 1" }}>
            movie
          </span>
        </div>
        <div>
          <div className="font-plus-jakarta-sans text-[14px] text-on-surface font-black">Video</div>
          <div className="font-inter text-[11px] text-on-surface-variant font-medium mt-0.5">Tonton videonya</div>
        </div>
      </button>

      {/* Infographic Card */}
      <button
        onClick={() => handleMediaClick("infographic")}
        className="bg-white/60 hover:bg-white p-4.5 rounded-2xl flex flex-col gap-3.5 items-start border border-outline-variant/15 hover:border-primary/25 hover:shadow-md transition-all duration-300 text-left cursor-pointer w-full select-none active:scale-[0.97]"
      >
        <div className="w-11 h-11 rounded-2xl bg-purple-100/50 flex items-center justify-center text-purple-600 shadow-inner shrink-0 border border-purple-200/20">
          <span className="material-symbols-outlined font-variation-fill" style={{ fontVariationSettings: "'FILL' 1" }}>
            image
          </span>
        </div>
        <div>
          <div className="font-plus-jakarta-sans text-[14px] text-on-surface font-black">Infografis</div>
          <div className="font-inter text-[11px] text-on-surface-variant font-medium mt-0.5">Lihat faktanya</div>
        </div>
      </button>

      {/* Interactive Lab Card */}
      <button
        onClick={() => handleMediaClick("lab")}
        className="bg-white/60 hover:bg-white p-4.5 rounded-2xl flex flex-col gap-3.5 items-start border border-outline-variant/15 hover:border-primary/25 hover:shadow-md transition-all duration-300 text-left relative overflow-hidden cursor-pointer w-full select-none active:scale-[0.97]"
      >
        <div className="absolute top-0 right-0 bg-primary-container text-on-primary-container font-plus-jakarta-sans text-[9px] px-2.5 py-1 rounded-bl-xl font-bold uppercase tracking-wider">
          3 GAME
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[#95f8a7]/30 flex items-center justify-center text-primary shadow-inner shrink-0 border border-primary/20">
          <span className="material-symbols-outlined font-variation-fill" style={{ fontVariationSettings: "'FILL' 1" }}>
            sports_esports
          </span>
        </div>
        <div>
          <div className="font-plus-jakarta-sans text-[14px] text-on-surface font-black">Lab Interaktif</div>
          <div className="font-inter text-[11px] text-on-surface-variant font-medium mt-0.5">Mainkan gamenya</div>
        </div>
      </button>
    </div>
  );
}
