"use client";

import { Topbar } from "@/components/layout/topbar";
import { ArtikelScanView } from "@/features/npp/scannen/components/artikel-scan-view";

// Same shell pattern as src/app/npp/boxoverzicht/page.tsx - shared Topbar
// only, no AppShell/Sidebar (NPP has its own touch-optimized layout).
// Starts empty and waits for a scan - no server-side fetch on load.
export default function NppScannen() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <main className="flex flex-1 overflow-auto">
        <ArtikelScanView />
      </main>
    </div>
  );
}
