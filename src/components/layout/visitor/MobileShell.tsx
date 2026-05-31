import type { ReactNode } from "react";

interface MobileShellProps {
  children: ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="w-full min-h-screen bg-surface-container-low flex justify-center items-center p-0 md:p-6 lg:p-8">
      <div className="w-full max-w-[430px] md:max-w-[850px] lg:max-w-[960px] min-h-screen md:min-h-[680px] md:h-[85vh] bg-background text-on-background flex flex-col shadow-2xl relative overflow-hidden border-x md:border border-outline-variant/20 md:rounded-3xl">
        {children}
      </div>
    </div>
  );
}

