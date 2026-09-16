"use client";

import { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TestModeBanner } from "@/features/auth/components/test-mode-banner";
import { useSession } from "@/features/auth/session";
import { setInterfaceMode } from "@/features/interface-mode/interface-mode";

export function AppShell({ children }: { children: React.ReactNode }) {
  // useSession() keeps the SSR render and the client's hydration render in
  // sync (both see no session, so the banner starts hidden) - a lazy
  // useState(() => getSession()...) initializer would instead re-read the
  // real flag during the hydration render itself, mismatching the server.
  const everyoneAdminActive = useSession()?.everyoneAdminActive ?? false;

  // AppShell is the one common choke point every real Luna page renders
  // through (there's no shared route-group layout.tsx). Mounting it
  // resets the persisted interface mode back to "luna", so the /npp
  // placeholder route (which does NOT render AppShell) is the only way
  // to keep the topbar showing NPP as active across reloads.
  useEffect(() => {
    setInterfaceMode("luna");
  }, []);

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
