"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, RotateCw, Check } from "lucide-react";
import { MediaBottomSheet } from "./MediaBottomSheet";
import { cn } from "@/lib/cn";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibitName: string;
  videoUrl?: string;
}

export function VideoPlayerModal({ isOpen, onClose, exhibitName, videoUrl }: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setHasPlayed(false);
      setShowControls(true);
      setCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err: any) => {
        console.error("Gagal memutar video:", err);
      });
    }
  };

  const handleRewind = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  };

  const handleForward = () => {
    if (!videoRef.current || duration === 0) return;
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasPlayed(false);
    setShowControls(true);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPercentage = clickX / width;
    const newTime = Math.min(duration, Math.max(0, newPercentage * duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Auto-hide controls logic
  const triggerShowControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      triggerShowControls();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const handleMouseMove = () => {
    triggerShowControls();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  const handleTouchStart = () => {
    triggerShowControls();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-click-toggle="true"]')) {
      return;
    }
    handlePlayToggle();
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <MediaBottomSheet isOpen={isOpen} onClose={onClose} title={`Tonton Video ${exhibitName}`}>
      <div className="flex flex-col w-full">
        {/* Video Player Viewport */}
        <div
          className="w-full aspect-video bg-on-surface rounded-2xl flex items-center justify-center mb-stack-md overflow-hidden relative shadow-inner group"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover cursor-pointer"
            playsInline
            onClick={handleContainerClick}
            onPlay={() => {
              setIsPlaying(true);
              setHasPlayed(true);
            }}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />

          {/* Custom Thumbnail (only shown before playing) */}
          {!hasPlayed && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70 pointer-events-none z-0"
              style={{
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDOrw08tq-hcLC_UaFf93jaF0Bl89Vcp4fWK65AnttEL0kn4up1fynMxQGG2wfk6OmrNAXee1xHAULUX9mUNFVA04o-1vWaO9yyQHcBAR4ltkhpgETee9UXAQ-nZNGWWVbZWCrGcehzVuC6DZHZEUsnepn_mVS1Vj1OeCfBwq8qCApnwD0Qe0wOTAPRkgt-vd5dNe5I-EPHr14oWvas9Xqm9fWf9CWH1xGtF9u43wHXIuiCbhD7C6G4-N3f8pG8TGVu2IfDyofDUw')",
              }}
            />
          )}

          {/* Unified Video Player Controls Overlay */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-between p-4 z-10 bg-black/45 transition-opacity duration-300",
              showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={handleContainerClick}
          >
            {/* Top row: Status/Title */}
            <div className="flex justify-between items-center w-full select-none" data-no-click-toggle="true">
              <span className="text-white/80 font-plus-jakarta-sans text-[11px] font-semibold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 uppercase tracking-wider">
                {isPlaying ? "Memutar Dokumenter" : "Dokumenter Sesi"}
              </span>
            </div>

            {/* Middle row: Central controls (Rewind, Play/Pause, Forward) */}
            <div className="flex items-center justify-center gap-6" data-no-click-toggle="true">
              {/* Rewind 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRewind();
                }}
                className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer backdrop-blur-sm border border-white/10"
                aria-label="Mundur 10 detik"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Big Play/Pause Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayToggle();
                }}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-sm",
                  isPlaying
                    ? "bg-black/50 hover:bg-black/70 text-white border border-white/20"
                    : "bg-primary hover:bg-primary-container text-on-primary"
                )}
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white stroke-[2.5]" />
                ) : (
                  <Play className="w-7 h-7 text-white translate-x-0.5 stroke-[2.5]" />
                )}
              </button>

              {/* Forward 10s */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleForward();
                }}
                className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer backdrop-blur-sm border border-white/10"
                aria-label="Maju 10 detik"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom row: Progress Bar and Time displays */}
            <div className="w-full flex flex-col gap-2" data-no-click-toggle="true">
              {/* Interactive Progress Bar */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleProgressClick(e);
                }}
                className="w-full bg-white/25 h-1.5 hover:h-2 rounded-full cursor-pointer relative transition-all flex items-center"
              >
                <div
                  className="bg-primary h-full rounded-full transition-all duration-100 ease-linear relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  {/* Handle knob */}
                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
                </div>
              </div>

              {/* Time Indicator */}
              <div className="flex justify-between items-center text-white/95 font-inter text-xs select-none font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Metadata */}
        <div className="text-center mb-stack-lg select-none">
          <h3 className="font-plus-jakarta-sans text-lg font-black text-on-surface mb-1">
            Dokumenter {exhibitName}
          </h3>
          <p className="font-inter text-xs text-on-surface-variant/80 font-semibold">
            Konservasi & Penyelamatan Subspesies Terancam Punah
          </p>
        </div>

        {/* Quick Close CTA */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-primary to-[#005c24] text-white rounded-full py-4 font-plus-jakarta-sans text-[13px] font-black tracking-widest uppercase flex justify-center items-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20 mb-2"
        >
          <span>Selesai Menonton</span>
          <Check className="w-4 h-4 text-white stroke-[3]" />
        </button>
      </div>
    </MediaBottomSheet>
  );
}
