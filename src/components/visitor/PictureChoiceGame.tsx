// src/components/visitor/PictureChoiceGame.tsx
"use client";

import { useState } from "react";
import { ArrowLeft, Beaker, Trophy, Info, Sparkles, Lightbulb, CheckCircle2, XCircle, Check, RotateCcw, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PictureChoiceConfig } from "@/types/admin.types";

interface PictureChoiceGameProps {
  config: PictureChoiceConfig;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export function PictureChoiceGame({ config, onComplete, onBack }: PictureChoiceGameProps) {
  const [phase, setPhase] = useState<"playing" | "result">("playing");
  const [selectedOptionId, setSelectedOptionId] = useState<string | number | null>(null);
  const [wrongOptionIds, setWrongOptionIds] = useState<Set<string | number>>(new Set());
  const [completionOverlay, setCompletionOverlay] = useState(false);

  const resetGame = () => {
    setPhase("playing");
    setSelectedOptionId(null);
    setWrongOptionIds(new Set());
    setCompletionOverlay(false);
  };

  const handleOptionClick = (optionId: string | number, isCorrect: boolean) => {
    if (completionOverlay || selectedOptionId) return;

    if (isCorrect) {
      setSelectedOptionId(optionId);
      setTimeout(() => {
        setCompletionOverlay(true);
        setTimeout(() => {
          setPhase("result");
          onComplete(1); // Score is 1 for a single question correct choice
        }, 1500);
      }, 600);
    } else {
      setWrongOptionIds((prev) => {
        const next = new Set(prev);
        next.add(optionId);
        return next;
      });
      // Clear incorrect style after a short duration so they can try again if they want,
      // or keep it marked as wrong. Keeping it marked as wrong is helpful for UX.
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
              Luar Biasa!
            </h2>
            <p className="font-inter text-sm text-on-surface-variant font-bold mt-1">
              Anda berhasil menjawab pertanyaan kuis dengan benar!
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] w-full border border-outline-variant/15 flex gap-4 items-start shadow-xl shadow-primary/5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/5 shadow-inner">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-plus-jakarta-sans text-[14px] font-black text-on-surface mb-1 uppercase tracking-wider">Fakta Menarik</h3>
              <p className="font-inter text-xs text-on-surface-variant leading-relaxed font-semibold">
                Kuis interaktif ini membantu memperluas pengetahuan konservasi satwa dengan cara yang menyenangkan.
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
            <HelpCircle className="w-5 h-5 text-[#95f8a7]" />
          </div>
          <div>
            <h1 className="font-plus-jakarta-sans text-lg font-black text-white uppercase tracking-wider leading-none">Kuis Bergambar</h1>
            <p className="font-inter text-[11px] text-on-primary-container mt-1 font-semibold opacity-90">Pilih Jawaban yang Benar! 💡</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-edge-margin flex flex-col gap-stack-md relative pb-12 overflow-y-auto hide-scrollbar select-none">
        {/* Question Card */}
        <div className="bg-gradient-to-b from-white/95 to-white/85 border border-white/50 shadow-xl shadow-primary/5 rounded-[2rem] p-6 backdrop-blur-lg mt-4 relative z-10">
          <h3 className="font-plus-jakarta-sans text-lg font-black text-on-surface text-center leading-snug uppercase tracking-wide">
            {config.question}
          </h3>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4 mt-4 relative z-10 pb-8">
          {config.options.map((opt) => {
            const isCorrectSelected = selectedOptionId === opt.id;
            const isWrongSelected = wrongOptionIds.has(opt.id);

            return (
              <button
                key={opt.id}
                onClick={() => handleOptionClick(opt.id, opt.isCorrect)}
                className={cn(
                  "bg-white/60 rounded-[2rem] border-2 p-3.5 flex flex-col items-center justify-between gap-3.5 text-center transition-all duration-200 cursor-pointer shadow-sm relative aspect-square group active:scale-95",
                  isCorrectSelected && "border-primary bg-primary/5 scale-102 shadow-md",
                  isWrongSelected && "border-red-500 bg-red-50/50 shake pointer-events-none opacity-60",
                  !isCorrectSelected && !isWrongSelected && "border-outline-variant/15 hover:border-primary/45"
                )}
              >
                <div className="w-full flex-1 rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/10 relative">
                  {opt.imageUrl ? (
                    <img
                      src={opt.imageUrl}
                      alt={opt.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-outline bg-primary/5">
                      <Sparkles className="w-8 h-8 text-primary/30" />
                    </div>
                  )}
                </div>
                <span className="font-plus-jakarta-sans text-[13px] font-black text-on-surface text-center leading-tight uppercase tracking-wider px-1 mb-1">
                  {opt.label}
                </span>

                {isCorrectSelected && (
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md select-none animate-pulse">
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                  </div>
                )}
                {isWrongSelected && (
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-red-500 text-on-error rounded-full flex items-center justify-center shadow-md select-none">
                    <X className="w-4 h-4 text-white stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion Overlay */}
      {completionOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/90 backdrop-blur-sm select-none">
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="w-24 h-24 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="font-plus-jakarta-sans text-[22px] font-black text-on-primary uppercase tracking-wide">Jawaban Benar! 🎉</h2>
            <p className="font-inter text-xs text-on-primary-container font-semibold">Menyimpan skor Anda...</p>
          </div>
        </div>
      )}
    </div>
  );
}
