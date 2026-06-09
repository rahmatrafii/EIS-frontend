"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Brain, Ruler } from "lucide-react";
import { MediaBottomSheet } from "./MediaBottomSheet";

interface InfographicModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibitName: string;
  imageUrl?: string;
}

export function InfographicModal({ isOpen, onClose, exhibitName, imageUrl }: InfographicModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);
  const startTouchRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef(0);

  // Reset zoom on close
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setIsDragging(false);
        setIsPinching(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageUrl || !containerRef.current) return;

    // Handle double tap
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap!
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
          setPosition({ x: 0, y: 0 });
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // Start panning
      setIsDragging(true);
      startTouchRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    } else if (e.touches.length === 2) {
      setIsPinching(true);
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialDistanceRef.current = Math.hypot(dx, dy);
      initialScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!imageUrl || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    if (e.touches.length === 1 && isDragging && scale > 1) {
      // Pan
      let newX = e.touches[0].clientX - startTouchRef.current.x;
      let newY = e.touches[0].clientY - startTouchRef.current.y;

      // Calculate boundaries based on scale
      const maxTx = (containerWidth * (scale - 1)) / 2;
      const maxTy = (containerHeight * (scale - 1)) / 2;

      newX = Math.max(-maxTx, Math.min(maxTx, newX));
      newY = Math.max(-maxTy, Math.min(maxTy, newY));

      setPosition({ x: newX, y: newY });
    } else if (e.touches.length === 2 && isPinching) {
      // Pinch
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      
      let newScale = initialScaleRef.current * (distance / initialDistanceRef.current);
      newScale = Math.max(1, Math.min(4, newScale));
      
      setScale(newScale);

      // Clamp position with the new scale
      const maxTx = (containerWidth * (newScale - 1)) / 2;
      const maxTy = (containerHeight * (newScale - 1)) / 2;

      setPosition(prev => ({
        x: Math.max(-maxTx, Math.min(maxTx, prev.x)),
        y: Math.max(-maxTy, Math.min(maxTy, prev.y))
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      setIsPinching(false);
      if (scale <= 1.05) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1) {
      setIsPinching(false);
      setIsDragging(true);
      startTouchRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  return (
    <MediaBottomSheet isOpen={isOpen} onClose={onClose} title={`Infografis ${exhibitName}`}>
      <div className="flex flex-col w-full">
        {/* Scrollable Infographic Image viewport */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full aspect-[3/4] bg-neutral-950 rounded-2xl border border-surface-variant overflow-hidden relative select-none pinch-zoom-container touch-none"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Infografis ${exhibitName}`}
              className="absolute inset-0 w-full h-full object-contain pointer-events-auto"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isPinching || isDragging ? "none" : "transform 0.15s ease-out",
              }}
              draggable={false}
            />
          ) : (
            /* Simulated beautiful infographic */
            <div className="absolute inset-0 p-6 flex flex-col justify-between items-center text-center bg-gradient-to-br from-primary/15 via-white to-[#95f8a7]/10 select-none animate-fade-in">
              {/* Header info */}
              <div className="w-full flex flex-col items-center">
                <span className="font-plus-jakarta-sans text-[10px] font-black tracking-widest text-primary uppercase mb-2">
                  WildGuide Infographics
                </span>
                <h4 className="font-plus-jakarta-sans text-[22px] font-black text-on-surface leading-tight uppercase tracking-tight">
                  {exhibitName}
                </h4>
                <div className="w-12 h-1 bg-primary rounded-full mt-3" />
              </div>

              {/* Anatomy emoji overlay */}
              <div className="text-[96px] drop-shadow-xl animate-pulse my-4 select-none">
                {exhibitName.toLowerCase().includes("harimau") ? "🐯" : "🐾"}
              </div>

              {/* Facts summary box */}
              <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-4.5 border border-outline-variant/15 flex flex-col gap-3.5 shadow-md text-left">
                <div className="flex gap-3.5 items-center">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/5">
                    <Brain className="w-4 h-4" />
                  </div>
                  <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
                    <strong className="text-on-surface">Predator Puncak:</strong> Memiliki peran vital menjaga keseimbangan ekosistem hutan hujan tropis.
                  </p>
                </div>
                <div className="flex gap-3.5 items-center border-t border-outline-variant/10 pt-3.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/5">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
                    <strong className="text-on-surface">Subspesies Terkecil:</strong> Ukuran tubuh yang adaptif untuk bergerak lincah di lebatnya rimba Sumatera.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pinch zoom visual guide */}
        <div className="text-center my-4 select-none">
          <p className="font-inter text-xs text-outline font-medium">
            {imageUrl ? "Gunakan dua jari untuk memperbesar gambar" : "Ketuk & geser untuk membaca fakta anatomi selengkapnya"}
          </p>
        </div>

        {/* Quick Close CTA */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-primary to-[#005c24] text-white rounded-full py-4 font-plus-jakarta-sans text-[13px] font-black tracking-widest uppercase flex justify-center items-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20 mb-2"
        >
          <span>Selesai Membaca</span>
          <Check className="w-4 h-4 text-white stroke-[3]" />
        </button>
      </div>
    </MediaBottomSheet>
  );
}
