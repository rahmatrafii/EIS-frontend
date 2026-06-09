// src/app/(visitor)/layout.tsx
"use client";

import type { ReactNode } from "react";
import { MobileShell } from "@/components/layout/visitor/MobileShell";

export default function VisitorLayout({ children }: { children: ReactNode }) {
  return (
    <MobileShell>
      {children}
    </MobileShell>
  );
}
