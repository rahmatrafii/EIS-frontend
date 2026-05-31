// src/components/ui/Input.tsx
import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="font-plus-jakarta-sans text-[12px] font-bold tracking-wider uppercase text-on-surface-variant ml-1"
        >
          {label}
          {props.required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-4 py-3 rounded-xl border bg-surface-container-lowest text-on-surface transition-colors",
          "placeholder:text-on-surface-variant/40",
          "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
          "disabled:bg-surface-container-low disabled:text-on-surface-variant/50 disabled:cursor-not-allowed",
          error ? "border-error focus:border-error focus:ring-error" : "border-outline-variant",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-error text-xs ml-1 mt-0.5 fade-in-up">
          {error}
        </span>
      )}
      {hint && !error && (
        <span className="text-on-surface-variant/60 text-xs ml-1 mt-0.5">
          {hint}
        </span>
      )}
    </div>
  );
}
