// src/components/visitor/MatchingGame.tsx
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Beaker, Trophy, Info, Sparkles, Lightbulb, CheckCircle2, XCircle, Check, RotateCcw, ChevronRight, Link } from "lucide-react";
import { cn } from "@/lib/cn";
import type { MatchingConfig } from "@/types/admin.types";

interface MatchingGameProps {
  config: MatchingConfig;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface MatchingItem {
  id: string | number;
  text: string;
}

export function MatchingGame({ config, onComplete, onBack }: MatchingGameProps) {
  const [phase, setPhase] = useState<"playing" | "result">("playing");
  const [leftItems, setLeftItems] = useState<MatchingItem[]>([]);
  const [rightItems, setRightItems] = useState<MatchingItem[]>([]);

  const [selectedLeft, setSelectedLeft] = useState<string | number | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | number | null>(null);

  const [matchedPairs, setMatchedPairs] = useState<(string | number)[]>([]);
  const [wrongMatch, setWrongMatch] = useState(false);
  const [completionOverlay, setCompletionOverlay] = useState(false);

  useEffect(() => {
    resetGame();
  }, [config.pairs]);

  const resetGame = () => {
    setPhase("playing");
    setMatchedPairs([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongMatch(false);
    setCompletionOverlay(false);

    setLeftItems(config.pairs.map((item) => ({ id: item.id, text: item.threat })));

    const shuffledRight = [...config.pairs]
      .sort(() => Math.random() - 0.5)
      .map((item) => ({ id: item.id, text: item.solution }));
    setRightItems(shuffledRight);
  };

  const handleLeftClick = (id: string | number) => {
    if (matchedPairs.includes(id)) return;
    setSelectedLeft(id);
    setWrongMatch(false);
    checkMatch(id, selectedRight);
  };

  const handleRightClick = (id: string | number) => {
    if (matchedPairs.includes(id)) return;
    setSelectedRight(id);
    setWrongMatch(false);
    checkMatch(selectedLeft, id);
  };

  const checkMatch = (leftId: string | number | null, rightId: string | number | null) => {
    if (leftId !== null && rightId !== null) {
      if (leftId === rightId) {
        const newMatched = [...matchedPairs, leftId];
        setMatchedPairs(newMatched);
        setSelectedLeft(null);
        setSelectedRight(null);

        if (newMatched.length === config.pairs.length) {
          setTimeout(() => {
            setCompletionOverlay(true);
            setTimeout(() => {
              setPhase("result");
              onComplete(newMatched.length);
            }, 1500);
          }, 500);
        }
      } else {
        setWrongMatch(true);
        setTimeout(() => {
          setWrongMatch(false);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 600);
      }
    }
  };

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
              Sempurna!
            </h2>
            <p className="font-inter text-sm text-on-surface-variant font-bold mt-1">
              Skor Anda: <span className="text-primary font-black">{matchedPairs.length}</span> / {config.pairs.length} Pasangan
            </p>
          </div>

          <div className="flex flex-col gap-3.5 w-full">
            {config.pairs.map((pair, index) => (
              <div
                key={pair.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-4.5 flex flex-col gap-2.5 border border-outline-variant/15 shadow-sm text-left"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="font-plus-jakarta-sans text-[9px] font-extrabold text-on-surface-variant uppercase tracking-widest">Pasangan {index + 1}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                  <div className="font-plus-jakarta-sans text-[13px] font-black text-on-surface text-center leading-tight uppercase tracking-wide">
                    {pair.threat}
                  </div>
                  <ChevronRight className="w-4 h-4 text-primary" />
                  <div className="font-plus-jakarta-sans text-[13px] font-black text-on-surface text-center leading-tight uppercase tracking-wide">
                    {pair.solution}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] w-full border border-outline-variant/15 flex gap-4 items-start shadow-xl shadow-primary/5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/5 shadow-inner">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-plus-jakarta-sans text-[14px] font-black text-on-surface mb-1 uppercase tracking-wider">Fakta Menarik</h3>
              <p className="font-inter text-xs text-on-surface-variant leading-relaxed font-semibold">
                Setiap ancaman membutuhkan solusi yang spesifik dan terukur. Pendekatan holistik adalah kunci keberhasilan konservasi.
              </p>
            </div>
          </div>

          {/* Bottom Actions Fixed Centered */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] md:max-w-[850px] lg:max-w-[960px] bg-white/85 backdrop-blur-lg border-t border-outline-variant/20 p-edge-margin flex flex-row gap-3 pb-8 z-20 shadow-md">
            <button
              onClick={resetGame}
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

  const progressPercent = config.pairs.length > 0 ? (matchedPairs.length / config.pairs.length) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-[#f7faf6] min-h-screen relative overflow-x-hidden select-none">
      {/* Decorative Ambient Background Blobs */}
      <div className="absolute right-[-100px] top-[150px] w-[350px] h-[350px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
      <div className="absolute left-[-100px] bottom-[200px] w-[300px] h-[300px] rounded-full bg-[#95f8a7]/10 blur-3xl z-0 pointer-events-none" />

      {/* Header */}
      <header className="bg-gradient-to-br from-primary via-on-primary-fixed-variant to-[#002f12] text-on-primary flex flex-col w-full sticky top-0 z-30 px-edge-margin pt-[50px] pb-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden shrink-0 select-none">
        {/* Glow Effects */}
        <div aria-hidden="true" className="absolute w-72 h-72 rounded-full bg-[#95f8a7]/10 blur-3xl -right-20 -top-20 z-0 pointer-events-none" />
        <div aria-hidden="true" className="absolute w-60 h-60 rounded-full bg-primary/20 blur-3xl -left-20 -bottom-20 z-0 pointer-events-none" />

        <button
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 active:scale-90 transition-transform cursor-pointer relative z-10 mb-4"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-sm">
            <Link className="w-5 h-5 text-[#95f8a7]" />
          </div>
          <div>
            <h1 className="font-plus-jakarta-sans text-lg font-black text-white uppercase tracking-wider leading-none">Lab Interaktif</h1>
            <p className="font-inter text-[11px] text-on-primary-container mt-1 font-semibold opacity-90">Cocokkan Ancaman & Solusi Konservasi! ⚖️</p>
          </div>
        </div>
      </header>

      {/* Progress Bar (Floating Deck) */}
      <div className="bg-white/60 backdrop-blur-md px-edge-margin py-stack-md border-b border-outline-variant/10 flex flex-col gap-2 sticky top-[116px] z-10 shadow-xs select-none">
        <div className="flex justify-between items-center">
          <span className="font-plus-jakarta-sans text-[11px] font-extrabold uppercase tracking-widest text-[#00652c]/85">Terpasang:</span>
          <span className="font-plus-jakarta-sans text-sm font-black bg-primary/10 border border-primary/10 px-3 py-1 rounded-full text-primary leading-none">
            {matchedPairs.length} / {config.pairs.length}
          </span>
        </div>
        <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden p-0.5 border border-outline-variant/5">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 p-edge-margin flex flex-col gap-stack-md relative pb-32 overflow-y-auto hide-scrollbar select-none">
        {/* Instruction Card */}
        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-4 flex gap-3 items-center shadow-sm relative z-10">
          <Lightbulb className="w-5 h-5 text-[#FF8F00] shrink-0 mt-0.5" />
          <p className="font-inter text-xs text-[#5D4037] leading-relaxed font-semibold">
            Ketuk ancaman di kiri, lalu ketuk solusi di kanan!
          </p>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-2 gap-4 mt-2 flex-1 pb-16 relative z-10">
          {/* Left Column - Ancaman */}
          <div className="flex flex-col gap-4">
            <h3 className="font-plus-jakarta-sans text-[11px] font-black text-outline text-center mb-1 uppercase tracking-widest">ANCAMAN</h3>
            {leftItems.map((item) => {
              const isSelected = selectedLeft === item.id;
              const isMatched = matchedPairs.includes(item.id);
              const isWrong = wrongMatch && isSelected;

              return (
                <div
                  key={`left-${item.id}`}
                  className={cn(
                    "bg-white/60 rounded-2xl border-2 min-h-[90px] flex items-center justify-center p-4 text-center transition-all duration-200 cursor-pointer shadow-xs relative active:scale-[0.97]",
                    isMatched && "bg-[#7cf994]/20 border-[#7cf994] text-primary opacity-60 scale-95 pointer-events-none shadow-none",
                    isWrong && "bg-red-50/50 border-red-500 text-red-500 shake",
                    isSelected && !isWrong && "bg-primary/5 border-primary scale-102 shadow-md",
                    !isMatched && !isWrong && !isSelected && "border-outline-variant/15 hover:border-primary/40"
                  )}
                  onClick={() => handleLeftClick(item.id)}
                >
                  <span className="font-plus-jakarta-sans text-[13px] font-black text-on-surface leading-tight uppercase tracking-wide">
                    {item.text}
                  </span>
                  {isMatched && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center font-plus-jakarta-sans font-black text-[10px] shadow-sm select-none">
                      {matchedPairs.indexOf(item.id) + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column - Solusi */}
          <div className="flex flex-col gap-4">
            <h3 className="font-plus-jakarta-sans text-[11px] font-black text-outline text-center mb-1 uppercase tracking-widest">SOLUSI</h3>
            {rightItems.map((item) => {
              const isSelected = selectedRight === item.id;
              const isMatched = matchedPairs.includes(item.id);
              const isWrong = wrongMatch && isSelected;

              return (
                <div
                  key={`right-${item.id}`}
                  className={cn(
                    "bg-white/60 rounded-2xl border-2 min-h-[90px] flex items-center justify-center p-4 text-center transition-all duration-200 cursor-pointer shadow-xs relative active:scale-[0.97]",
                    isMatched && "bg-[#7cf994]/20 border-[#7cf994] text-primary opacity-60 scale-95 pointer-events-none shadow-none",
                    isWrong && "bg-red-50/50 border-red-500 text-red-500 shake",
                    isSelected && !isWrong && "bg-primary/5 border-primary scale-102 shadow-md",
                    !isMatched && !isWrong && !isSelected && "border-outline-variant/15 hover:border-primary/40"
                  )}
                  onClick={() => handleRightClick(item.id)}
                >
                  <span className="font-plus-jakarta-sans text-[13px] font-black text-on-surface leading-tight uppercase tracking-wide">
                    {item.text}
                  </span>
                  {isMatched && (
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center font-plus-jakarta-sans font-black text-[10px] shadow-sm select-none">
                      {matchedPairs.indexOf(item.id) + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Completion Overlay */}
      {completionOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm select-none">
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="w-24 h-24 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="font-plus-jakarta-sans text-[22px] font-black text-on-primary uppercase tracking-wide">Semua terpasang! 🎉</h2>
            <p className="font-inter text-xs text-on-primary-container font-semibold">Menganalisis hasil...</p>
          </div>
        </div>
      )}
    </div>
  );
}
