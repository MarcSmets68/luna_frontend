"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TestModeBanner } from "@/features/auth/components/test-mode-banner";
import { useSession } from "@/features/auth/session";

export function AppShell({ children }: { children: React.ReactNode }) {
  // useSession() keeps the SSR render and the client's hydration render in
  // sync (both see no session, so the banner starts hidden) - a lazy
  // useState(() => getSession()...) initializer would instead re-read the
  // real flag during the hydration render itself, mismatching the server.
  const everyoneAdminActive = useSession()?.everyoneAdminActive ?? false;

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
