// src/components/ui/ToastContainer.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/stores/ToastContext";
import { cn } from "@/lib/cn";

const TOAST_ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const TOAST_STYLES = {
  success: "bg-secondary-container text-on-secondary-container border border-primary/20",
  error:   "bg-error-container text-on-error-container border border-error/20",
  warning: "bg-amber-50 text-amber-900 border border-amber-200",
  info:    "bg-sky-50 text-sky-900 border border-sky-200",
};

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[380px] px-gutter z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl px-4 py-3",
                "text-sm font-medium shadow-lg backdrop-blur-md",
                TOAST_STYLES[toast.type]
              )}
            >
              <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <span className="flex-1 font-inter text-[13px] leading-snug">{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
