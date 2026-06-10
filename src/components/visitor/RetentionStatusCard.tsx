// src/components/visitor/RetentionStatusCard.tsx
import { cn } from "@/lib/cn";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export type RetentionStatusType = "PENDING" | "SENT" | "COMPLETED" | "EXPIRED" | "LOCKED";

interface RetentionStatusCardProps {
  label: string;
  title: string;
  date: string;
  status: RetentionStatusType;
  token?: string | null;
}

export function RetentionStatusCard({ label, title, date, status, token }: RetentionStatusCardProps) {
  // Map status values to UI presentation
  const config = {
    PENDING: {
      uiLabel: "Menunggu",
      iconName: "hourglass_empty",
      badgeClass: "bg-amber-500/10 text-amber-700 border border-amber-500/15",
      cardClass: "border-amber-100/50 bg-gradient-to-b from-white to-amber-50/10",
    },
    LOCKED: {
      uiLabel: "Terkunci",
      iconName: "lock",
      badgeClass: "bg-surface-container-high text-on-surface-variant/65 border border-outline-variant/10",
      cardClass: "opacity-60 border-outline-variant/5 bg-white/50",
    },
    SENT: {
      uiLabel: "Siap Dikerjakan",
      iconName: "play_circle",
      badgeClass: "bg-primary-container text-primary border border-primary/15 animate-pulse",
      cardClass: "border-primary/15 bg-gradient-to-b from-white to-primary/[0.02] shadow-sm shadow-primary/5",
    },
    COMPLETED: {
      uiLabel: "Selesai",
      iconName: "check_circle",
      badgeClass: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/15",
      cardClass: "border-emerald-100/50 bg-gradient-to-b from-white to-emerald-50/10",
    },
    EXPIRED: {
      uiLabel: "Kadaluarsa",
      iconName: "cancel",
      badgeClass: "bg-error-container/20 text-error border border-error/15",
      cardClass: "border-error/10 bg-gradient-to-b from-white to-error/[0.01]",
    },
  }[status];

  if (!config) return null;

  const isClickable = status === "SENT" && !!token;
  const cardClassName = cn(
    "border rounded-[1.75rem] p-5 flex flex-col justify-between min-h-[140px] shadow-[0_4px_16px_rgba(0,0,0,0.01)] transition-all duration-300 hover:shadow-md",
    config.cardClass,
    isClickable && "cursor-pointer hover:border-primary/45 active:scale-[0.98]"
  );

  const cardContent = (
    <>
      <div className="flex justify-between items-start gap-1">
        <span className="font-plus-jakarta-sans text-[15px] font-black tracking-tight text-on-surface">{label}</span>
        <span className={cn("font-plus-jakarta-sans text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 select-none", config.badgeClass)}>
          <span className="material-symbols-outlined text-[11px] font-bold">
            {config.iconName}
          </span>
          {config.uiLabel}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-xs text-on-surface-variant/95 mb-1 font-inter font-medium leading-snug">{title}</p>
        <p className="text-[9px] font-plus-jakarta-sans font-bold tracking-widest uppercase text-outline/80">{date}</p>
      </div>
    </>
  );

  if (isClickable && token) {
    return (
      <Link href={ROUTES.retention(token)} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClassName}>
      {cardContent}
    </div>
  );
}

