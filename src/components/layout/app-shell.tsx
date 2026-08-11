import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
