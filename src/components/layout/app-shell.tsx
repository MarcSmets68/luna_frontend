import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground print:h-auto print:overflow-visible">
      <Sidebar className="print:hidden" />
      <div className="flex h-full flex-1 flex-col overflow-hidden print:h-auto print:overflow-visible">
        <Topbar className="print:hidden" />
        <main className="flex-1 overflow-auto p-8 print:overflow-visible print:p-0">{children}</main>
      </div>
    </div>
  );
}
