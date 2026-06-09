// src/components/ui/ConfirmModal.tsx
"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "./Spinner";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when modal is open
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

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(25,28,29,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current && !isLoading) onClose();
      }}
      id="confirm-modal-overlay"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{
          backgroundColor: "var(--color-surface-container-lowest)",
          boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* Body */}
        <div className="p-6">
          {/* Icon */}
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: isDanger
                ? "rgba(186,26,26,0.1)"
                : "rgba(0,93,66,0.1)",
              color: isDanger
                ? "var(--color-error)"
                : "var(--color-primary)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
              {isDanger ? "warning" : "info"}
            </span>
          </div>

          {/* Title */}
          <h3
            className="font-headline-sm text-headline-sm mb-2"
            style={{ color: "var(--color-on-surface)" }}
          >
            {title}
          </h3>

          {/* Description */}
          <p
            className="font-body-md text-body-md"
            style={{ color: "var(--color-on-surface-variant)" }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 px-6 py-4"
          style={{
            backgroundColor: "var(--color-surface)",
            borderTop: "1px solid rgba(189,201,193,0.3)",
          }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg px-4 py-2 font-label-md text-label-md transition-colors"
            style={{ color: "var(--color-on-surface-variant)" }}
            id="confirm-modal-cancel"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg px-4 py-2 font-label-md text-label-md shadow-sm transition-colors disabled:opacity-60"
            style={{
              backgroundColor: isDanger
                ? "var(--color-error)"
                : "var(--color-primary)",
              color: isDanger
                ? "var(--color-on-error)"
                : "var(--color-on-primary)",
            }}
            id="confirm-modal-confirm"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Memproses...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
