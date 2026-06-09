"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, MapPin, User, Clock, Timer, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PageLoader } from "@/components/ui/PageLoader";

import { getUserProfile } from "@/services/auth.service";
import { checkoutExhibit } from "@/services/track.service";
import { useToast } from "@/stores/ToastContext";
import { ROUTES } from "@/constants/routes";
import { PageTransition } from "@/components/layout/PageTransition";
import { MediaGrid } from "@/components/visitor/MediaGrid";
import { AudioPlayerModal } from "@/components/visitor/AudioPlayerModal";
import { VideoPlayerModal } from "@/components/visitor/VideoPlayerModal";
import { InfographicModal } from "@/components/visitor/InfographicModal";
import { LabModal } from "@/components/visitor/LabModal";

import type { UserProfile } from "@/types/user.types";
import type { Exhibit, LearningPathContent } from "@/types/exhibit.types";
import type { CheckinMedia } from "@/types/tracking.types";

interface ExhibitDetailContentProps {
  exhibitId: string;
}

export function ExhibitDetailContent({ exhibitId }: ExhibitDetailContentProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [learningContent, setLearningContent] = useState<LearningPathContent | null>(null);
  const [mediaList, setMediaList] = useState<CheckinMedia[]>([]);
  const [interactionId, setInteractionId] = useState<number | null>(null);
  const [activeMedia, setActiveMedia] = useState<"audio" | "video" | "infographic" | "lab" | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  const [checkInTime, setCheckInTime] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("eis_current_checkin_time");
      if (stored) return stored;
      const now = new Date().toISOString();
      sessionStorage.setItem("eis_current_checkin_time", now);
      return now;
    }
    return new Date().toISOString();
  });

  // Load profile and exhibit details on mount
  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await getUserProfile();
        if (profileRes.success) {
          setProfile(profileRes.data);
        }

        // Retrieve from sessionStorage
        const storedExhibit = sessionStorage.getItem("eis_current_exhibit");
        const storedContents = sessionStorage.getItem("eis_current_learning_contents");
        const storedMedia = sessionStorage.getItem("eis_current_media");
        const storedIntId = sessionStorage.getItem("eis_current_interaction_id");

        if (storedExhibit) {
          const parsedExhibit = JSON.parse(storedExhibit) as Exhibit;
          // Ensure it matches the requested ID
          if (parsedExhibit.id.toString() === exhibitId) {
            setExhibit(parsedExhibit);
          }
        }

        if (storedContents) {
          const parsedContents = JSON.parse(storedContents) as LearningPathContent[];
          if (parsedContents && parsedContents.length > 0) {
            setLearningContent(parsedContents[0]);
          }
        }

        if (storedMedia) {
          const parsedMedia = JSON.parse(storedMedia) as CheckinMedia[];
          setMediaList(parsedMedia);
        }

        if (storedIntId) {
          setInteractionId(parseInt(storedIntId, 10));
        }

      } catch (err) {
        console.error("Error loading exhibit data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [exhibitId]);

  // Handle redirect if no session data is present
  useEffect(() => {
    if (!isLoading && !exhibit) {
      toast.warning("Silakan scan QR Code kandang terlebih dahulu.");
      router.push(ROUTES.home);
    }
  }, [isLoading, exhibit, router, toast]);

  // Duration Timer logic
  useEffect(() => {
    if (!checkInTime) return;
    const start = new Date(checkInTime).getTime();

    const interval = setInterval(() => {
      const diffMs = Date.now() - start;
      if (diffMs <= 0) {
        setElapsedTime("00:00:00");
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      const formattedHrs = hrs.toString().padStart(2, "0");
      const formattedMins = mins.toString().padStart(2, "0");
      const formattedSecs = secs.toString().padStart(2, "0");

      setElapsedTime(`${formattedHrs}:${formattedMins}:${formattedSecs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [checkInTime]);

  // Handle back navigation
  const handleBack = () => {
    router.push(ROUTES.home);
  };

  // Handle exhibit checkout
  const handleCheckout = async () => {
    if (!interactionId) {
      // Fallback if interaction ID is missing
      sessionStorage.removeItem("eis_current_exhibit");
      sessionStorage.removeItem("eis_current_interaction_id");
      sessionStorage.removeItem("eis_current_learning_contents");
      sessionStorage.removeItem("eis_current_media");
      sessionStorage.removeItem("eis_current_checkin_time");
      toast.success("Checkout berhasil!");
      router.push(ROUTES.home);
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const checkoutRes = await checkoutExhibit({ interactionId });
      if (checkoutRes.success) {
        toast.success("Kunjungan di kandang ini selesai.");
      } else {
        toast.error("Gagal melakukan checkout otomatis, sesi diselesaikan lokal.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      // Clean up local storage in any case to avoid getting stuck
      sessionStorage.removeItem("eis_current_exhibit");
      sessionStorage.removeItem("eis_current_interaction_id");
      sessionStorage.removeItem("eis_current_learning_contents");
      sessionStorage.removeItem("eis_current_media");
      sessionStorage.removeItem("eis_current_checkin_time");
      setIsCheckoutLoading(false);
      router.push(ROUTES.home);
    }
  };

  if (isLoading || !exhibit) {
    return <PageLoader text="Memuat konten kandang..." minHeight="min-h-[600px]" />;
  }

  // Calculate local time display
  const checkInHourFormatted = checkInTime
    ? new Date(checkInTime).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }) + " WIB"
    : "10:00 WIB";

  // Determine age category label
  const userAge = profile?.age ?? 20;
  let ageCategoryTag = "KONTEN DEWASA";
  if (userAge >= 5 && userAge <= 11) ageCategoryTag = "KONTEN ANAK-ANAK";
  else if (userAge >= 12 && userAge <= 17) ageCategoryTag = "KONTEN REMAJA";

  // Default values to achieve 100% similarity with static HTML
  const emoji = exhibit.emoji || "🐯";
  const zoneName = exhibit.zone || "ZONA MAMALIA";
  const exhibitName = exhibit.name || "Harimau Sumatera";
  const learningTitle = learningContent?.contentTitle || learningContent?.title || `${exhibitName} & Krisis Konservasi`;
  const learningBody = learningContent?.contentBody || learningContent?.body || exhibit.description || "";

  return (
    <PageTransition className="w-full min-h-screen bg-[#f7faf6] relative overflow-x-hidden pb-36 flex flex-col select-none">
      {/* Decorative Ambient Background Blobs */}
      <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
      <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

      {/* Floating Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-edge-margin pt-12 pb-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 active:scale-90 transition-transform cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 select-none flex items-center gap-1.5 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[#95f8a7]" />
          <span className="font-plus-jakarta-sans text-[10px] font-black tracking-wider uppercase text-white leading-none">
            {zoneName}
          </span>
        </div>
      </header>

      {/* Hero Image Section */}
      <section className="relative h-[300px] w-full bg-gradient-to-b from-primary to-secondary overflow-hidden">
        {exhibit.imageUrl ? (
          <>
            <motion.img
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              src={exhibit.imageUrl}
              alt={exhibitName}
              className="w-full h-full object-cover relative z-0"
            />
            {/* Dark gradient mask for the top (under text) and bottom (blend into content) */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#f7faf6]/90 z-10" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12]" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="text-[85px] drop-shadow-xl z-10 relative mt-8 select-none flex justify-center items-center h-full text-center"
            >
              {emoji}
            </motion.div>
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#f7faf6] to-transparent z-10" />
          </>
        )}

        {/* Text and Badge Overlaid at the Bottom of Hero */}
        <div className="absolute bottom-12 left-0 right-0 px-edge-margin z-20 flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-[#005c24] px-4 py-2 rounded-full border border-primary-fixed/20 shadow-md w-fit select-none">
            <span className="w-2 h-2 rounded-full bg-[#95f8a7] animate-pulse"></span>
            <span className="font-plus-jakarta-sans font-extrabold text-[10px] tracking-wider uppercase text-[#95f8a7]">
              Sedang Dikunjungi
            </span>
          </div>
          <h1 className="font-plus-jakarta-sans text-[28px] font-black text-on-surface mb-0 tracking-tight leading-tight uppercase drop-shadow-sm">
            {exhibitName}
          </h1>
        </div>
      </section>

      {/* Main Content Card Canvas */}
      <main className="flex-1 bg-transparent px-edge-margin pb-36 relative z-20 -mt-8">
        <div className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2.5rem] p-7 backdrop-blur-lg flex flex-col gap-6 fade-in-up">
          
          {/* Header Info: Age & Check-in Time */}
          <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/10 select-none">
              <User className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="font-plus-jakarta-sans text-[10px] font-black tracking-widest uppercase text-primary leading-none">
                {ageCategoryTag}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant/80 font-inter text-[11px] font-semibold">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Check-in: {checkInHourFormatted}</span>
            </div>
          </div>

          {/* Description Section */}
          <div className="flex flex-col gap-3">
            <h2 className="font-plus-jakarta-sans text-[18px] font-black text-on-surface tracking-tight leading-snug">
              {learningTitle}
            </h2>
            <div 
              className="rich-text-content text-justify text-on-surface-variant font-inter text-xs leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: learningBody }}
            />
          </div>

          <div className="h-px bg-outline-variant/20 w-full" />

          {/* Media Grid Section */}
          <div className="flex flex-col gap-4">
            <h3 className="font-plus-jakarta-sans text-[13px] font-black text-on-surface tracking-widest uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Aktivitas Pembelajaran
            </h3>
            
            {/* Media Grid */}
            <MediaGrid
              exhibitId={exhibitId}
              interactionId={interactionId ?? 0}
              onMediaClick={(type) => setActiveMedia(type)}
            />
          </div>

        </div>
      </main>

      {/* Media Player Modals */}
      <AudioPlayerModal
        isOpen={activeMedia === "audio"}
        onClose={() => setActiveMedia(null)}
        exhibitName={exhibit?.name ?? "Satwa"}
        audioUrl={mediaList.find((m) => m.mediaType === "AUDIO")?.fileUrl}
      />
      <VideoPlayerModal
        isOpen={activeMedia === "video"}
        onClose={() => setActiveMedia(null)}
        exhibitName={exhibit?.name ?? "Satwa"}
        videoUrl={mediaList.find((m) => m.mediaType === "VIDEO")?.fileUrl}
      />
      <InfographicModal
        isOpen={activeMedia === "infographic"}
        onClose={() => setActiveMedia(null)}
        exhibitName={exhibit?.name ?? "Satwa"}
        imageUrl={mediaList.find((m) => m.mediaType === "IMAGE_INFOGRAPHIC")?.fileUrl}
      />
      <LabModal
        isOpen={activeMedia === "lab"}
        onClose={() => setActiveMedia(null)}
        exhibitName={exhibit?.name ?? "Satwa"}
      />

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] md:max-w-[850px] lg:max-w-[960px] bg-white/85 backdrop-blur-lg border-t border-outline-variant/25 z-40 pb-safe shadow-lg">
        <div className="flex items-center justify-between p-edge-margin gap-4 fade-in-up" style={{ animationDelay: "300ms" }}>
          <div className="flex flex-col select-none">
            <span className="font-plus-jakarta-sans text-[9px] font-extrabold tracking-widest uppercase text-outline/80 mb-1">
              DURASI KUNJUNGAN
            </span>
            <div className="flex items-center gap-1.5 text-on-surface">
              <Timer className="w-4 h-4 text-primary" />
              <span className="font-plus-jakarta-sans text-[15px] font-black tracking-wider leading-none">{elapsedTime}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isCheckoutLoading}
            className="flex-1 bg-gradient-to-r from-red-500 to-[#ef4444] hover:brightness-105 disabled:opacity-50 text-white rounded-full py-4 px-6 flex items-center justify-center gap-2 font-plus-jakarta-sans text-[13px] font-black tracking-widest uppercase transition-all shadow-md shadow-red-500/10 cursor-pointer select-none active:scale-[0.98]"
          >
            {isCheckoutLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Selesai di Kandang Ini</span>
                <Check className="w-4 h-4 text-white stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
