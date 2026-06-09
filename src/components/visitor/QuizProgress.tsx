"use client";

import { motion } from "framer-motion";

interface QuizProgressProps {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-end">
        <span className="font-plus-jakarta-sans text-[12px] font-bold text-primary tracking-widest uppercase">
          SOAL {current} DARI {total}
        </span>
      </div>
      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
