import type { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="w-full min-h-screen bg-surface-container-low flex justify-center p-0">
      <div className="w-full max-w-[430px] md:max-w-[850px] lg:max-w-[960px] min-h-screen bg-background text-on-background flex flex-col shadow-2xl relative overflow-y-auto border-x md:border border-outline-variant/20">
        {children}
      </div>
    </div>
  );
}

