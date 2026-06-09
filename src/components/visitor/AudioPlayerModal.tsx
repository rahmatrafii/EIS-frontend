"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import { MediaBottomSheet } from "./MediaBottomSheet";

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibitName: string;
  audioUrl?: string;
}

const WAVE_BARS_COUNT = 35;
// Fixed sample heights for visual balance
const WAVE_BARS_HEIGHTS = [
  40, 75, 50, 90, 35, 60, 80, 45, 70, 30,
  85, 55, 95, 40, 70, 60, 35, 50, 80, 45,
  90, 65, 40, 75, 30, 85, 50, 60, 95, 40,
  70, 55, 80, 35, 60
];

export function AudioPlayerModal({ isOpen, onClose, exhibitName, audioUrl }: AudioPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(92); // Default to 92s if not loaded
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Gagal memutar audio:", err);
      });
    }
  };

  const handleRewind = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const handleForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPercentage = clickX / width;
    const newTime = Math.min(duration, Math.max(0, newPercentage * duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 92);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isHarimau = exhibitName.toLowerCase().includes("harimau");

  return (
    <MediaBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isHarimau ? `Dengarkan Auman ${exhibitName}` : `Dengarkan Suara ${exhibitName}`}
    >
      <div className="flex flex-col w-full">
        {/* Native Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />

        {/* Staggered animation delays for the wave bars to create an organic movement */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes waveBar {
            0% { transform: scaleY(0.2); }
            100% { transform: scaleY(1); }
          }
          .wave-bar {
            transform: scaleY(0.2);
            transition: transform 0.3s ease-out;
          }
          .wave-playing .wave-bar {
            animation: waveBar 1.2s infinite ease-in-out alternate;
          }
          .wave-bar:nth-child(1) { animation-delay: 0.1s; }
          .wave-bar:nth-child(2) { animation-delay: 0.3s; }
          .wave-bar:nth-child(3) { animation-delay: 0.2s; }
          .wave-bar:nth-child(4) { animation-delay: 0.5s; }
          .wave-bar:nth-child(5) { animation-delay: 0.4s; }
          .wave-bar:nth-child(6) { animation-delay: 0.6s; }
          .wave-bar:nth-child(7) { animation-delay: 0.8s; }
          .wave-bar:nth-child(8) { animation-delay: 0.7s; }
          .wave-bar:nth-child(9) { animation-delay: 0.9s; }
          .wave-bar:nth-child(10) { animation-delay: 1.1s; }
          .wave-bar:nth-child(11) { animation-delay: 1.0s; }
          .wave-bar:nth-child(12) { animation-delay: 1.2s; }
          .wave-bar:nth-child(13) { animation-delay: 0.8s; }
          .wave-bar:nth-child(14) { animation-delay: 0.6s; }
          .wave-bar:nth-child(15) { animation-delay: 0.5s; }
          .wave-bar:nth-child(16) { animation-delay: 0.3s; }
          .wave-bar:nth-child(17) { animation-delay: 0.2s; }
          .wave-bar:nth-child(18) { animation-delay: 0.1s; }
          .wave-bar:nth-child(19) { animation-delay: 0.3s; }
          .wave-bar:nth-child(20) { animation-delay: 0.5s; }
          .wave-bar:nth-child(21) { animation-delay: 0.7s; }
          .wave-bar:nth-child(22) { animation-delay: 0.9s; }
          .wave-bar:nth-child(23) { animation-delay: 1.1s; }
          .wave-bar:nth-child(24) { animation-delay: 1.0s; }
          .wave-bar:nth-child(25) { animation-delay: 0.8s; }
          .wave-bar:nth-child(26) { animation-delay: 0.6s; }
          .wave-bar:nth-child(27) { animation-delay: 0.4s; }
          .wave-bar:nth-child(28) { animation-delay: 0.2s; }
          .wave-bar:nth-child(29) { animation-delay: 0.1s; }
          .wave-bar:nth-child(30) { animation-delay: 0.3s; }
          .wave-bar:nth-child(31) { animation-delay: 0.7s; }
          .wave-bar:nth-child(32) { animation-delay: 0.5s; }
          .wave-bar:nth-child(33) { animation-delay: 0.9s; }
          .wave-bar:nth-child(34) { animation-delay: 1.1s; }
          .wave-bar:nth-child(35) { animation-delay: 0.8s; }
        `}} />

        {/* Central Visualization Area */}
        <div className="w-full aspect-video bg-gradient-to-br from-gray-900 via-[#003d1c] to-[#001f0a] rounded-2xl flex items-center justify-center mb-stack-md overflow-hidden relative shadow-inner">
          {/* Atmospheric background foliage cover */}
          <div
            className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none select-none"
            style={{
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDOrw08tq-hcLC_UaFf93jaF0Bl89Vcp4fWK65AnttEL0kn4up1fynMxQGG2wfk6OmrNAXee1xHAULUX9mUNFVA04o-1vWaO9yyQHcBAR4ltkhpgETee9UXAQ-nZNGWWVbZWCrGcehzVuC6DZHZEUsnepn_mVS1Vj1OeCfBwq8qCApnwD0Qe0wOTAPRkgt-vd5dNe5I-EPHr14oWvas9Xqm9fWf9CWH1xGtF9u43wHXIuiCbhD7C6G4-N3f8pG8TGVu2IfDyofDUw')",
            }}
          />

          {/* Waveform Container */}
          <div
            className={`flex items-end justify-center h-24 gap-1 w-full px-4 relative z-10 ${
              isPlaying ? "wave-playing" : "wave-paused"
            }`}
          >
            {Array.from({ length: WAVE_BARS_COUNT }).map((_, i) => (
              <div
                key={i}
                className="wave-bar w-[1%] max-w-[4px] h-full bg-[#79db8d] rounded-full origin-bottom"
                style={{
                  height: `${WAVE_BARS_HEIGHTS[i]}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="text-center mb-stack-lg select-none">
          <h3 className="font-plus-jakarta-sans text-lg font-black text-on-surface mb-1 uppercase tracking-tight">
            {exhibitName}
          </h3>
          <p className="font-inter text-xs text-on-surface-variant font-semibold">
            {isHarimau ? "Panthera tigris sumatrae" : "Spesies Kebun Binatang"} • Rekaman Alam Liar
          </p>
        </div>

        {/* Playback Progress Bar */}
        <div className="mb-stack-lg px-1 select-none">
          <div
            onClick={handleProgressClick}
            className="w-full bg-surface-container-high h-1.5 hover:h-2 rounded-full cursor-pointer relative transition-all flex items-center mb-2"
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-100 ease-linear relative"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Handle knob */}
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md" />
            </div>
          </div>
          <div className="flex justify-between font-inter text-[11px] text-on-surface-variant/80 font-bold uppercase tracking-wider">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls Layout */}
        <div className="flex justify-center items-center gap-6 mb-stack-lg">
          {/* Rewind 10s */}
          <button
            onClick={handleRewind}
            aria-label="Rewind 10 seconds"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 border border-outline-variant/15 hover:bg-white text-on-surface shadow-sm cursor-pointer select-none active:scale-90 duration-100 shrink-0"
          >
            <RotateCcw className="w-5 h-5 text-on-surface-variant" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            aria-label="Play or Pause"
            className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-[#005c24] hover:brightness-105 transition-transform duration-200 active:scale-95 text-white shadow-lg shadow-primary/25 cursor-pointer select-none shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white stroke-[2.5]" />
            ) : (
              <Play className="w-8 h-8 text-white translate-x-0.5 stroke-[2.5]" />
            )}
          </button>

          {/* Forward 10s */}
          <button
            onClick={handleForward}
            aria-label="Forward 10 seconds"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 border border-outline-variant/15 hover:bg-white text-on-surface shadow-sm cursor-pointer select-none active:scale-90 duration-100 shrink-0"
          >
            <RotateCw className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Bottom Volume Hint */}
        <div className="flex items-center justify-center gap-2 bg-primary/[0.04] border border-primary/10 rounded-2xl py-3.5 px-4 select-none mb-2 shadow-inner">
          <Volume2 className="w-4 h-4 text-primary animate-pulse" />
          <p className="font-inter text-xs text-primary font-bold">
            Pastikan volume HP kamu sudah aktif
          </p>
        </div>
      </div>
    </MediaBottomSheet>
  );
}
