import { Topbar } from "@/components/layout/topbar";

// Deliberately no AppShell/Sidebar - NPP (atelier) is a placeholder
// screen for now, sharing only the global Topbar so the interface
// switch and logout remain available. No architecture doc yet for the
// real NPP screen; this route exists only to host the topbar toggle.
export default function Npp() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-[15px] text-muted-foreground">
          NPP (atelier) — binnenkort beschikbaar
        </p>
      </main>
    </div>
  );
}
