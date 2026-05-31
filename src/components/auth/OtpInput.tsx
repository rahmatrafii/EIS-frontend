// src/components/auth/OtpInput.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";

interface OtpInputProps {
  length?: number;
  onChange: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  shakeTrigger?: boolean;
}

export function OtpInput({
  length = 6,
  onChange,
  disabled = false,
  hasError = false,
  shakeTrigger = false,
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Menggabungkan array value dan mengirimkan ke parent
  useEffect(() => {
    onChange(values.join(""));
  }, [values, onChange]);

  // Efek untuk reset/clear input jika terjadi error
  useEffect(() => {
    if (hasError) {
      setValues(Array(length).fill(""));
      // Fokus kembali ke input pertama
      inputRefs.current[0]?.focus();
    }
  }, [hasError, length]);

  // Menangani perubahan input karakter per kotak
  function handleInputChange(index: number, val: string) {
    const numericVal = val.replace(/[^0-9]/g, "").slice(0, 1);
    const newValues = [...values];
    newValues[index] = numericVal;
    setValues(newValues);

    // Auto-focus kotak berikutnya jika terisi
    if (numericVal && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  // Menangani penekanan tombol backspace untuk navigasi mundur
  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!values[index] && index > 0) {
        // Jika kotak kosong, fokus mundur dan hapus
        const newValues = [...values];
        newValues[index - 1] = "";
        setValues(newValues);
        inputRefs.current[index - 1]?.focus();
      } else if (values[index]) {
        // Jika terisi, hapus nilainya saja
        const newValues = [...values];
        newValues[index] = "";
        setValues(newValues);
      }
    }
  }

  // Menangani penempelan data (Paste) kode OTP 6 digit
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, length);

    if (pastedData) {
      const newValues = [...values];
      for (let i = 0; i < pastedData.length; i++) {
        newValues[i] = pastedData[i];
      }
      setValues(newValues);

      // Fokus pada input terakhir yang relevan
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  }

  // Animasi getar (shake) jika validasi gagal
  const shakeVariants: Variants = {
    shake: {
      x: [0, -8, 8, -8, 8, -6, 6, -4, 4, 0],
      transition: { duration: 0.5, ease: "easeInOut" },
    },
    idle: { x: 0 },
  };

  return (
    <motion.div
      variants={shakeVariants}
      animate={shakeTrigger ? "shake" : "idle"}
      className="flex justify-between w-full mb-stack-lg gap-2"
    >
      {Array.from({ length }).map((_, i) => {
        const isFilled = values[i] !== "";
        return (
          <input
            key={i}
            ref={(el) => {
              if (el) inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={values[i]}
            disabled={disabled}
            onChange={(e) => handleInputChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              "w-12 h-12 border-2 rounded-xl text-center font-plus-jakarta-sans text-[20px] font-bold transition-all focus:outline-none focus:ring-1",
              disabled && "opacity-50 cursor-not-allowed bg-surface-container-low",
              isFilled
                ? "border-primary text-primary focus:border-primary focus:ring-primary"
                : "border-outline-variant text-on-surface focus:border-primary focus:ring-primary",
              hasError && "border-error text-error focus:border-error focus:ring-error"
            )}
            autoFocus={i === 0}
          />
        );
      })}
    </motion.div>
  );
}
