"use client";

import { Topbar } from "@/components/layout/topbar";
import { StockbewegingView } from "@/features/npp/stockbeweging/components/stockbeweging-view";

// Same shell pattern as src/app/npp/scannen/page.tsx - shared Topbar
// only, no AppShell/Sidebar (NPP has its own touch-optimized layout).
// Starts empty and waits for a scan - no server-side fetch on load.
export default function NppStockbeweging() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <main className="flex flex-1 overflow-auto">
        <StockbewegingView />
      </main>
    </div>
  );
}
