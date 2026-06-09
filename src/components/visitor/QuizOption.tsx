"use client";

import { cn } from "@/lib/cn";

interface QuizOptionProps {
  label: "A" | "B" | "C" | "D";
  text: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function QuizOption({ label, text, isSelected, onSelect }: QuizOptionProps) {
  return (
    <button
      onClick={onSelect}
      type="button"
      className={cn(
        "w-full text-left bg-surface border-2 border-outline-variant rounded-xl p-4 flex items-center gap-4 transition-all duration-200 cursor-pointer select-none active:scale-[0.99]",
        isSelected 
          ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
          : "hover:border-primary/50"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full border-2 border-outline-variant flex items-center justify-center font-plus-jakarta-sans text-sm font-semibold text-outline transition-colors shrink-0",
          isSelected && "border-primary bg-primary text-on-primary"
        )}
      >
        {label}
      </div>
      <span className={cn(
        "font-inter text-[14px] text-on-surface leading-normal",
        isSelected && "font-semibold text-primary"
      )}>
        {text}
      </span>
    </button>
  );
}
