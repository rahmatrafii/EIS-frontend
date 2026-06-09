"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { slideUp } from "@/lib/animations";

interface MediaBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  customHeader?: ReactNode;
  children: ReactNode;
}

export function MediaBottomSheet({ isOpen, onClose, title = "", customHeader, children }: MediaBottomSheetProps) {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay (matching responsive shell width and centering) */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-50 w-full max-w-[430px] md:max-w-[850px] lg:max-w-[960px] mx-auto"
          />

          {/* Bottom Sheet Container (matching responsive shell width and centering) */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col justify-end w-full max-w-[430px] md:max-w-[850px] lg:max-w-[960px] mx-auto pointer-events-none pb-safe">
            <motion.div
              key="sheet"
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full bg-gradient-to-b from-white to-surface-container-low rounded-t-[2.5rem] relative pointer-events-auto shadow-[0_-8px_32px_rgba(0,0,0,0.12)] flex flex-col max-h-[90vh] overflow-hidden border-t border-outline-variant/10"
            >
              {/* Drag Handle / Visual cue */}
              <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-outline-variant rounded-full" />
              </div>

              {/* Render custom header if provided, otherwise render the standard one */}
              {customHeader ? (
                customHeader
              ) : (
                <div className="px-edge-margin pb-stack-sm flex justify-between items-center shrink-0">
                  <h2 className="font-heading-md text-heading-md text-on-surface line-clamp-1 flex-1 pr-4 select-none">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface cursor-pointer select-none active:scale-95 duration-100"
                  >
                    <X className="w-4 h-4 text-on-surface" />
                  </button>
                </div>
              )}

              {/* Sheet content area */}
              <div className="overflow-y-auto w-full px-edge-margin pb-stack-lg">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
