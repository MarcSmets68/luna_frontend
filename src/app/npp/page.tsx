import { Topbar } from "@/components/layout/topbar";
import { NppMenu } from "@/features/npp/components/npp-menu";

// Deliberately no AppShell/Sidebar - NPP (atelier) has its own touch-
// optimized layout, sharing only the global Topbar so the interface
// switch and logout remain available. See features/npp/components/npp-menu.tsx
// for the current visual-only draft (no navigation/functionality yet).
export default function Npp() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Topbar />
      <main className="flex flex-1 overflow-auto">
        <NppMenu />
      </main>
    </div>
  );
}
