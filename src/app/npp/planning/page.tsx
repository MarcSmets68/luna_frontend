"use client";

import { Topbar } from "@/components/layout/topbar";
import { PlanningView } from "@/features/npp/planning/components/planning-view";

// Same shell pattern as src/app/npp/boxoverzicht/page.tsx - shared Topbar
// only, no AppShell/Sidebar, no auth. Read-only production queue.
export default function NppPlanning() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <main className="flex flex-1 overflow-auto">
        <PlanningView />
      </main>
    </div>
  );
}
