import type { DashboardResponse } from "@/lib/api-client";
import { StatCards } from "./stat-cards";
import { RecentActivityCard } from "./recent-activity-card";
import { ProductionCard } from "./production-card";

const today = new Date().toLocaleDateString("nl-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function DashboardPage({ dashboard }: { dashboard: DashboardResponse }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Overzicht
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Dashboard</h1>
        <div className="text-[13px] text-muted-foreground capitalize">{today}</div>
      </div>

      <StatCards statCards={dashboard.statCards} />

      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <RecentActivityCard items={dashboard.recentActivity} />
        <ProductionCard items={dashboard.productionThisWeek} />
      </div>
    </div>
  );
}
