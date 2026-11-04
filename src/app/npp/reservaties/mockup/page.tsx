"use client";

import { Topbar } from "@/components/layout/topbar";
import { ReservatieMockup } from "@/features/npp/reservatie-mockup/components/reservatie-mockup";

export default function NppReservatiesMockupPage() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <div
        role="status"
        className="border-b border-warning-fg/20 bg-warning-bg px-6 py-2 text-center text-sm font-medium text-warning-fg sm:px-8"
      >
        Mockup &ndash; voorbeelddata, niet gekoppeld aan de backend
      </div>
      <main className="flex flex-1 overflow-auto">
        <ReservatieMockup />
      </main>
    </div>
  );
}
