// src/components/layout/visitor/PageHeader.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title?: string;
  backHref?: string;
  className?: string;
  onBack?: () => void;
  centerTitle?: boolean;
}

export function PageHeader({ title, backHref, className, onBack, centerTitle = false }: PageHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  }

  return (
    <nav className={cn("flex items-center w-full z-10 relative", className)}>
      <button
        onClick={handleBack}
        className={cn(
          "text-on-primary hover:bg-primary-container/20 transition-colors rounded-full p-2 active:scale-95 duration-100 flex items-center justify-center cursor-pointer select-none z-20",
          centerTitle && "absolute left-0"
        )}
        aria-label="Kembali"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      {title && (
        <h1
          className={cn(
            "text-on-primary font-plus-jakarta-sans font-bold text-lg z-10",
            centerTitle ? "w-full text-center" : "ml-2"
          )}
        >
          {title}
        </h1>
      )}
    </nav>
  );
}
