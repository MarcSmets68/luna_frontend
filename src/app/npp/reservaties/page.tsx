"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { ReservatiesOverview } from "@/features/npp/reservaties/components/reservaties-overview";
import type { NppReservatieMode } from "@/features/npp/reservaties/types";

// Same shell pattern as src/app/npp/boxoverzicht/page.tsx. The active
// tab lives in the URL (?mode=direct|productie, default direct).
function ReservatiesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode: NppReservatieMode =
    searchParams.get("mode") === "productie" ? "productie" : "direct";

  return (
    <ReservatiesOverview
      mode={mode}
      onModeChange={(next) => router.replace(`${pathname}?mode=${next}`)}
    />
  );
}

export default function NppReservaties() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <main className="flex flex-1 overflow-auto">
        <Suspense fallback={null}>
          <ReservatiesContent />
        </Suspense>
      </main>
    </div>
  );
}
