"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TestModeBanner } from "@/features/auth/components/test-mode-banner";
import { getSession } from "@/features/auth/session";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Lazy initial state (not an effect) - getSession() itself guards for a
  // browser environment, so this is safe during SSR (returns false there)
  // and reads the real flag synchronously on client render/hydration.
  const [everyoneAdminActive] = useState(() => getSession()?.everyoneAdminActive ?? false);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground print:h-auto print:overflow-visible">
      <TestModeBanner active={everyoneAdminActive} className="print:hidden" />
      <div className="flex h-full w-full flex-1 overflow-hidden">
        <Sidebar className="print:hidden" />
        <div className="flex h-full flex-1 flex-col overflow-hidden print:h-auto print:overflow-visible">
          <Topbar className="print:hidden" />
          <main className="flex-1 overflow-auto p-8 print:overflow-visible print:p-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
