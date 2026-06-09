// src/components/visitor/DragDropGame.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, Beaker, Trophy, Info, Sparkles, Lightbulb, CheckCircle2, XCircle, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DragDropConfig } from "@/types/admin.types";

// ─── Types ───────────────────────────────────────────────

interface DragDropGameProps {
  exhibitName: string;
  config: DragDropConfig;
  onComplete: (score: number) => void;
  onBack: () => void;
}

type GamePhase = "playing" | "result";

// ─── Helper: shuffle array ──────────────────────────────

function shuffleArray<T>(arr: readonly T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─── Component ──────────────────────────────────────────

export function DragDropGame({ exhibitName, config, onComplete, onBack }: DragDropGameProps) {
  const TOTAL_CORRECT = config.items.filter((i) => i.isCorrect).length;

  const [phase, setPhase] = useState<GamePhase>("playing");
  const [currentScore, setCurrentScore] = useState(0);
  const [droppedItems, setDroppedItems] = useState<Set<string>>(new Set());
  const [shuffledItems, setShuffledItems] = useState<any[]>([]);
  const [shakingItem, setShakingItem] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);

  // Refs for touch handling
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef<string | null>(null);
  const cloneRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const originalElementRef = useRef<HTMLDivElement | null>(null);

  // Initialize shuffled items
  useEffect(() => {
    setShuffledItems(shuffleArray(config.items));
  }, [config.items]);

  // ─── Game Logic ──────────────────────────────────

  const handleShowFeedback = useCallback((isCorrect: boolean) => {
    setFeedbackType(isCorrect ? "correct" : "wrong");
    setTimeout(() => {
      setFeedbackType(null);
    }, 500);
  }, []);

  const handleProcessDrop = useCallback(
    (itemId: string) => {
      const item = config.items.find((i) => String(i.id) === itemId);
      if (!item) return;

      if (item.isCorrect && !droppedItems.has(itemId)) {
        const newDropped = new Set(droppedItems);
        newDropped.add(itemId);
        setDroppedItems(newDropped);

        const newScore = currentScore + 1;
        setCurrentScore(newScore);
        handleShowFeedback(true);

        if (newScore >= TOTAL_CORRECT) {
          setTimeout(() => {
            setPhase("result");
            onComplete(newScore);
          }, 1000);
        }
      } else if (!item.isCorrect) {
        setShakingItem(itemId);
        handleShowFeedback(false);
        setTimeout(() => setShakingItem(null), 400);
      }
    },
    [droppedItems, currentScore, handleShowFeedback, onComplete, config.items, TOTAL_CORRECT]
  );

  // ─── Desktop Drag & Drop ─────────────────────────

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, itemId: string) {
    draggedRef.current = itemId;
    e.dataTransfer.setData("text/plain", itemId);
    const target = e.currentTarget;
    setTimeout(() => {
      if (target) {
        target.classList.add("opacity-50");
      }
    }, 0);
  }

  function handleDragEnd(e: React.DragEvent<HTMLDivElement>) {
    e.currentTarget.classList.remove("opacity-50");
    draggedRef.current = null;
    setDropZoneActive(false);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDropZoneActive(true);
  }

  function handleDragLeave() {
    setDropZoneActive(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDropZoneActive(false);
    const itemId = draggedRef.current;
    if (itemId) {
      handleProcessDrop(itemId);
    }
  }

  // ─── Mobile Touch Handlers ───────────────────────

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>, itemId: string) {
    if (droppedItems.has(itemId)) return;
    e.preventDefault();

    draggedRef.current = itemId;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    const target = e.currentTarget;
    originalElementRef.current = target;

    // Create visual clone for drag
    const clone = target.cloneNode(true) as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    clone.style.position = "fixed";
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.zIndex = "100";
    clone.style.opacity = "0.8";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);
    cloneRef.current = clone;

    target.style.opacity = "0.3";
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!cloneRef.current || !draggedRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (originalElementRef.current) {
      const rect = originalElementRef.current.getBoundingClientRect();
      cloneRef.current.style.top = `${rect.top + dy}px`;
      cloneRef.current.style.left = `${rect.left + dx}px`;
    }

    // Check intersection with drop zone
    if (dropZoneRef.current) {
      const dropRect = dropZoneRef.current.getBoundingClientRect();
      const isOver =
        touch.clientX > dropRect.left &&
        touch.clientX < dropRect.right &&
        touch.clientY > dropRect.top &&
        touch.clientY < dropRect.bottom;
      setDropZoneActive(isOver);
    }
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (!draggedRef.current) return;

    // Clean up clone
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }
    if (originalElementRef.current) {
      originalElementRef.current.style.opacity = "1";
      originalElementRef.current = null;
    }

    // Check if dropped on zone
    if (dropZoneRef.current) {
      const dropRect = dropZoneRef.current.getBoundingClientRect();
      const touch = e.changedTouches[0];
      const isOver =
        touch.clientX > dropRect.left &&
        touch.clientX < dropRect.right &&
        touch.clientY > dropRect.top &&
        touch.clientY < dropRect.bottom;

      if (isOver) {
        handleProcessDrop(draggedRef.current);
      }
    }

    setDropZoneActive(false);
    draggedRef.current = null;
  }

  // ─── Reset Game ──────────────────────────────────

  function handleResetGame() {
    setPhase("playing");
    setCurrentScore(0);
    setDroppedItems(new Set());
    setShuffledItems(shuffleArray(config.items));
    setShakingItem(null);
    setFeedbackType(null);
    setDropZoneActive(false);
  }

  // ─── Progress ────────────────────────────────────

  const progressPercent = TOTAL_CORRECT > 0 ? (currentScore / TOTAL_CORRECT) * 100 : 0;

  // ─── Cleanup touch clone on unmount ──────────────

  useEffect(() => {
    return () => {
      if (cloneRef.current) {
        cloneRef.current.remove();
      }
    };
  }, []);

  // ─── Result Phase ────────────────────────────────
 
  if (phase === "result") {
    return (
      <div className="w-full min-h-screen bg-[#f7faf6] flex flex-col relative overflow-x-hidden select-none">
        {/* Decorative Ambient Background Blobs */}
        <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
        <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

        <main className="flex-1 flex flex-col items-center justify-center px-edge-margin py-10 gap-6 fade-in-up relative z-10 pb-44">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-[#005c24] rounded-[2rem] flex items-center justify-center mb-2 shadow-[0_0_50px_rgba(0,101,44,0.3)] border border-primary-fixed/20 relative animate-bounce">
            {/* Glow ring */}
            <div className="absolute inset-[-4px] rounded-[2.2rem] border-2 border-primary/30 animate-pulse pointer-events-none"></div>
            <Trophy className="text-white w-12 h-12 stroke-[2]" />
          </div>
          
          <div className="text-center">
            <h2 className="font-plus-jakarta-sans text-[32px] font-black text-primary uppercase tracking-tight">
              Kerja Bagus!
            </h2>
            <p className="font-inter text-sm text-on-surface-variant font-bold mt-1">
              Skor Anda: <span className="text-primary font-black">{currentScore}</span> / {TOTAL_CORRECT} Benar
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] w-full border border-outline-variant/15 flex gap-4 items-start shadow-xl shadow-primary/5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/5 shadow-inner">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-plus-jakarta-sans text-[14px] font-black text-on-surface mb-1 uppercase tracking-wider">Fakta Menarik</h3>
              <p className="font-inter text-xs text-on-surface-variant leading-relaxed font-semibold">
                Dana konservasi dan pengelolaan yang tepat sangat penting untuk menjaga kelestarian satwa
                langka di habitat aslinya.
              </p>
            </div>
          </div>

          {/* Bottom Actions Fixed Centered */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] md:max-w-[850px] lg:max-w-[960px] bg-white/85 backdrop-blur-lg border-t border-outline-variant/20 p-edge-margin flex flex-row gap-3 pb-8 z-20 shadow-md">
            <button
              onClick={handleResetGame}
              className="flex-1 py-4 rounded-full bg-white border border-outline-variant/35 text-primary font-plus-jakarta-sans text-[13px] font-black tracking-widest uppercase flex items-center justify-center gap-1.5 hover:bg-surface-container-low transition-all cursor-pointer active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 text-primary" />
              Main Lagi
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-4 rounded-full bg-gradient-to-r from-primary to-[#005c24] text-white font-plus-jakarta-sans text-[13px] font-black tracking-widest uppercase flex items-center justify-center gap-1.5 hover:brightness-105 transition-all shadow-lg shadow-primary/25 cursor-pointer active:scale-[0.98]"
            >
              <Check className="w-4 h-4 text-white stroke-[3]" />
              Ke Kandang
            </button>
          </div>
        </main>
      </div>
    );
  }
 
  // ─── Playing Phase ───────────────────────────────
 
  return (
    <div className="w-full min-h-screen bg-[#f7faf6] flex flex-col relative overflow-x-hidden select-none">
      {/* Decorative Ambient Background Blobs */}
      <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
      <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

      {/* Header */}
      <header className="bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12] text-on-primary flex items-center justify-between px-edge-margin pt-[50px] pb-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden shrink-0">
        {/* Glow Effects inside header */}
        <div aria-hidden="true" className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/10 blur-3xl -right-20 -top-20 z-0 pointer-events-none" />
        <div aria-hidden="true" className="absolute w-60 h-60 rounded-full bg-primary/20 blur-3xl -left-20 -bottom-20 z-0 pointer-events-none" />

        <button
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 active:scale-90 transition-transform cursor-pointer relative z-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2 relative z-10 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <Beaker className="w-4 h-4 text-[#95f8a7]" />
          <span className="font-plus-jakarta-sans text-[11px] font-black tracking-wider uppercase text-white leading-none">Lab Interaktif</span>
        </div>
      </header>
 
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-edge-margin py-stack-md gap-stack-lg overflow-y-auto fade-in-up pb-12">
        {/* Progress Section */}
        <div className="flex flex-col gap-2 relative z-10 mt-2">
          <div className="flex justify-between items-center text-primary">
            <span className="font-plus-jakarta-sans text-[11px] font-extrabold uppercase tracking-widest text-[#00652c]/85">Progres Alokasi</span>
            <span className="font-plus-jakarta-sans text-sm font-black bg-primary/10 border border-primary/10 px-3 py-1 rounded-full text-primary leading-none">
              {currentScore} / {TOTAL_CORRECT} Benar
            </span>
          </div>
          <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden p-0.5 border border-outline-variant/5">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
 
        {/* Instruction Card */}
        <div className="bg-[#FFF8E1] border border-[#FFE082] p-4.5 rounded-2xl shadow-sm flex items-start gap-3 relative z-10">
          <Lightbulb className="w-5 h-5 text-[#FF8F00] shrink-0 mt-0.5" />
          <p className="font-inter text-xs text-[#5D4037] leading-relaxed font-semibold">
            {config.target.label || "Alokasikan Dana Konservasi!"} Tarik item yang sesuai ke zona target.
          </p>
        </div>
 
        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-4 border-dashed border-outline-variant/30 rounded-[2.5rem] h-64 flex flex-col items-center justify-center gap-4 transition-colors duration-300 relative bg-white/70 backdrop-blur-md shadow-sm z-10",
            dropZoneActive && "border-primary bg-primary/5 shadow-md",
            feedbackType === "correct" && "border-primary bg-primary/10 shadow-md",
            feedbackType === "wrong" && "border-red-500 bg-red-50/50 shake shadow-md"
          )}
        >
          {config.target.imageUrl ? (
            <img
              src={config.target.imageUrl}
              alt={config.target.label}
              className="w-24 h-24 object-contain mb-1 rounded-2xl border border-outline-variant/10 bg-white/50 p-1"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/5 mb-1 shadow-inner text-3xl">
              📥
            </div>
          )}
          <h3 className="font-plus-jakarta-sans text-lg font-black text-on-surface text-center px-4 leading-tight uppercase tracking-wide">
            {config.target.label || "Zona Target"}
          </h3>
          <p className="font-inter text-xs text-on-surface-variant/70 text-center px-4 font-semibold">
            Tarik item ke sini
          </p>
          {/* Feedback overlay */}
          <div
            className={cn(
               "absolute inset-0 rounded-[2.5rem] flex items-center justify-center bg-white/95 backdrop-blur-xs transition-opacity duration-300 pointer-events-none",
               feedbackType ? "opacity-100" : "opacity-0"
            )}
          >
             {feedbackType === "correct" ? (
               <CheckCircle2 className="w-14 h-14 text-primary animate-pulse stroke-[2.5]" />
             ) : (
               <XCircle className="w-14 h-14 text-red-500 stroke-[2.5]" />
             )}
          </div>
        </div>
 
        {/* Draggable Items Grid */}
        <div className="grid grid-cols-2 gap-4 relative z-10 pb-8">
          {shuffledItems.map((item) => {
            const isDropped = droppedItems.has(String(item.id));
            const isShaking = shakingItem === String(item.id);
 
            return (
              <div
                key={item.id}
                draggable={!isDropped}
                onDragStart={(e) => handleDragStart(e, String(item.id))}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, String(item.id))}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={cn(
                  "bg-white/60 border border-outline-variant/15 rounded-2xl p-4.5 flex flex-col items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all select-none touch-none aspect-square active:scale-[0.97]",
                  !isDropped && "cursor-grab active:cursor-grabbing hover:border-primary/25",
                  isDropped && "drag-item-disabled bg-[#7cf994]/20 text-primary border-[#7cf994] opacity-50 scale-95 pointer-events-none",
                  isShaking && "border-red-500 bg-red-50/50 shake"
                )}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.label}
                    className="w-16 h-16 object-contain pointer-events-none rounded-xl"
                  />
                ) : (
                  <span className="text-4xl pointer-events-none">📦</span>
                )}
                <span className="text-label-caps text-on-surface text-center pointer-events-none font-semibold leading-tight">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
