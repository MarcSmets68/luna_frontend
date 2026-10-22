import { AppShell } from "@/components/layout/app-shell";
import { Progress } from "@/components/ui/progress";

export default function PlanningLoading() {
  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Productie
        </div>
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold text-foreground">Planning</h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-3 text-center">
            <Progress value={null} />
            <p className="text-sm text-muted-foreground">Planning wordt geladen...</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
