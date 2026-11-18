"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TestModeBanner } from "@/features/auth/components/test-mode-banner";
import { useSession } from "@/features/auth/session";
import { setInterfaceMode } from "@/features/interface-mode/interface-mode";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  // A mobile drawer must release its focus trap when resizing to desktop.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setNavigationOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
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
    <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground print:h-auto print:overflow-visible">
        <TestModeBanner active={everyoneAdminActive} className="print:hidden" />
        <div className="flex min-h-0 w-full flex-1 overflow-hidden print:overflow-visible">
          <Sidebar className="hidden md:flex print:hidden" />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden print:overflow-visible">
            <Topbar
              className="print:hidden"
              navigationTrigger={
                <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu openen" />}>
                  <Menu aria-hidden="true" />
                </SheetTrigger>
              }
            />
            <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8 print:overflow-visible print:p-0">
              <div className="mx-auto w-full max-w-[1600px]">{children}</div>
            </main>
          </div>
        </div>
      </div>
      <SheetContent showCloseButton={false} aria-describedby={undefined} className="left-0 right-auto w-72 gap-0 border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground data-open:slide-in-from-left data-closed:slide-out-to-left print:hidden">
        <SheetTitle className="sr-only">Nomaled</SheetTitle>
        <SheetClose render={<Button variant="ghost" size="icon-sm" className="absolute top-5 right-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-white" aria-label="Menu sluiten" />}>
          <X aria-hidden="true" />
        </SheetClose>
        <Sidebar className="w-full" onNavigate={() => setNavigationOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
