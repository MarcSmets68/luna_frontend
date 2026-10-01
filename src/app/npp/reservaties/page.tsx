"use client";

import { Topbar } from "@/components/layout/topbar";
import { ReservatiesView } from "@/features/npp/reservaties/components/reservaties-view";

// Same shell pattern as src/app/npp/planning/page.tsx - shared Topbar
// only, no AppShell/Sidebar, no auth. Read-only reservation queue.
export default function NppReservaties() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <main className="flex flex-1 overflow-auto">
        <ReservatiesView />
      </main>
    </div>
  );
}
