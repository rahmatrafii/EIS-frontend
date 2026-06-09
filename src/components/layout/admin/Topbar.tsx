// src/components/layout/admin/Topbar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { removeToken } from "@/lib/token";
import { getUserProfile } from "@/services/auth.service";
import { useToast } from "@/stores/ToastContext";
import { ROUTES } from "@/constants/routes";
import type { UserProfile } from "@/types/user.types";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function Topbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<UserProfile | null>(null);
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const result = await getUserProfile();
        if (result.success) {
          setAdminUser(result.data);
        }
      } catch {
        // silently fail — topbar still renders
      }
    }
    loadProfile();
  }, []);

  const handleLogout = () => {
    removeToken();
    document.cookie = "eis_auth=; path=/; max-age=0";
    document.cookie = "eis_role=; path=/; max-age=0";
    toast.success("Logout berhasil!");
    router.replace(ROUTES.admin.login);
  };

  return (
    <header
      className="sticky top-0 w-full z-45 flex h-[72px] justify-between items-center px-6 py-0 transition-all duration-300"
      style={{
        backgroundColor: "var(--color-surface-container-lowest)",
        borderBottom: "1px solid rgba(189,201,193,0.15)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.01)",
      }}
    >
      {/* Left: Breadcrumbs Page Indicator */}
      <div className="flex items-center gap-2 text-on-surface-variant/75">
        <span className="font-label-sm text-[11px] uppercase tracking-wider font-semibold select-none">
          ZooLogix
        </span>
        <span className="material-symbols-outlined text-[14px] select-none">
          chevron_right
        </span>
        <span className="font-label-sm text-[12px] font-bold text-primary select-none">
          Overview
        </span>
      </div>

      {/* Right: Profile & Actions */}
      <div className="flex items-center gap-4">
        {/* Profile Section */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              {adminUser?.name || "Admin"}
            </span>
            <span
              className="font-label-sm text-[11px] px-2 py-0.5 rounded-full mt-0.5 flex items-center gap-1.5 font-medium border border-secondary/20 bg-secondary/5 text-secondary select-none"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Sesi Aktif
            </span>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-label-md text-[13px] font-bold shadow-sm border border-primary/10 select-none"
            style={{
              backgroundColor: "rgba(0, 101, 44, 0.08)",
              color: "var(--color-primary)",
            }}
          >
            {adminUser?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-outline-variant/30 hidden sm:block" />

        {/* Logout Button */}
        <button
          onClick={() => setIsConfirmLogoutOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-label-sm text-[13px] font-semibold border border-error/20 bg-error/5 text-error hover:bg-error hover:text-on-error transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] select-none">logout</span>
          Keluar
        </button>
      </div>

      <ConfirmModal
        isOpen={isConfirmLogoutOpen}
        onClose={() => setIsConfirmLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar"
        description="Apakah Anda yakin ingin keluar dari panel admin ZooLogix?"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        variant="danger"
      />
    </header>
  );
}
