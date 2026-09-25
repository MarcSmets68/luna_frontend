"use client";

import { Topbar } from "@/components/layout/topbar";
import { KwaliteitscontroleView } from "@/features/npp/kwaliteitscontrole/components/kwaliteitscontrole-view";

// Same shell pattern as src/app/npp/stockbeweging/page.tsx - shared
// Topbar only, no AppShell/Sidebar (NPP has its own touch-optimized
// layout). The queue fetch happens inside KwaliteitscontroleView on
// mount, not here.
export default function NppKwaliteitscontrole() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <main className="flex flex-1 overflow-auto">
        <KwaliteitscontroleView />
      </main>
    </div>
  );
}
