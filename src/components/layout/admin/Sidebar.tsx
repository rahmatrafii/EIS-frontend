// src/components/layout/admin/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const mainNavItems: NavItem[] = [
  { href: ROUTES.admin.dashboard, label: "Dashboard", icon: "dashboard" },
  { href: ROUTES.admin.analyticsExhibits, label: "Analytics", icon: "analytics" },
  { href: ROUTES.admin.exhibits, label: "Exhibits", icon: "pets" },
  { href: ROUTES.admin.quizzes, label: "Quizzes", icon: "quiz" },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === ROUTES.admin.dashboard) {
      return pathname === href;
    }
    if (href === ROUTES.admin.analyticsExhibits) {
      return pathname.startsWith("/admin/analytics");
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed left-0 top-0 h-screen flex flex-col overflow-visible border-r border-outline-variant/30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transition-[width] duration-300 ease-in-out"
      style={{
        width: isCollapsed ? "78px" : "260px",
        backgroundColor: "var(--color-surface-container-lowest)",
        color: "var(--color-on-surface)",
        fontFamily: "var(--font-work-sans), sans-serif",
      }}
      id="sidenav"
    >
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute right-[-14px] top-6 w-7 h-7 bg-surface-container-lowest border border-outline-variant/30 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-surface-container-low hover:text-primary transition-all z-[60]"
        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <span className="material-symbols-outlined text-[16px] select-none">
          {isCollapsed ? "chevron_right" : "chevron_left"}
        </span>
      </button>

      {/* Logo Section */}
      <div
        className="p-5 flex items-center h-[72px]"
        style={{ borderBottom: "1px solid rgba(189,201,193,0.15)" }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-[0_4px_10px_rgba(0,101,44,0.15)]">
            <span className="material-symbols-outlined text-[20px] select-none">
              pets
            </span>
          </div>
          <div className={`flex flex-col transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[150px]"}`}>
            <span className="font-headline-sm text-[16px] font-bold text-on-surface leading-tight">
              ZooLogix
            </span>
            <span className="text-[11px] text-on-surface-variant/75 font-medium leading-none mt-0.5">
              Portal Admin
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-1.5 px-3">
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group relative flex items-center h-11 rounded-xl transition-all duration-200 ${
                    isCollapsed ? "justify-center px-0 w-11 mx-auto" : "px-4 w-full"
                  }`}
                  style={{
                    color: active ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active
                      ? "rgba(0, 101, 44, 0.08)"
                      : "transparent",
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span
                    className={`material-symbols-outlined ${active ? "fill-icon" : ""} text-[22px] transition-transform duration-200 group-hover:scale-105 select-none`}
                  >
                    {item.icon}
                  </span>
                  <span className={`font-label-sm text-[13px] transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${
                    isCollapsed ? "opacity-0 max-w-0 ml-0" : "opacity-100 max-w-[150px] ml-3"
                  }`}>
                    {item.label}
                  </span>

                  {/* Active Indicator Line */}
                  {active && !isCollapsed && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-md" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
