// src/components/layout/admin/AdminShell.tsx
"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import type { ReactNode } from "react";

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div
        className="flex-1 flex flex-col h-screen transition-[margin] duration-300 ease-in-out"
        style={{ marginLeft: isCollapsed ? "78px" : "260px" }}
        id="main-content"
      >
        <Topbar />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: "var(--color-surface-container-low)" }}
        >
          <div className="max-w-[1440px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
