import type { DashboardResponse } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { StatCards } from "./stat-cards";
import { RecentActivityCard } from "./recent-activity-card";
import { ProductionCard } from "./production-card";
import { AiSearchCard } from "./ai-search-card";
import { OmzetTrendCard } from "./omzet-trend-card";
import { TopKlantenCard } from "./top-klanten-card";
import { TopArtikelenCard } from "./top-artikelen-card";
import { VoorraadbewegingenCard } from "./voorraadbewegingen-card";

const today = new Date().toLocaleDateString("nl-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function DashboardPage({ dashboard }: { dashboard: DashboardResponse }) {
  return (
    <div>
      <PageHeader section="Overzicht" title="Dashboard">
        <span className="capitalize">{today}</span>
      </PageHeader>

      <StatCards statCards={dashboard.statCards} />

      <div className="mb-7">
        <OmzetTrendCard items={dashboard.omzetTrend ?? []} />
      </div>

      <div className="mb-7 grid gap-5 xl:grid-cols-2">
        <TopKlantenCard items={dashboard.topKlanten ?? []} error={dashboard.topKlantenError ?? false} />
        <TopArtikelenCard items={dashboard.topArtikelen ?? []} error={dashboard.topArtikelenError ?? false} />
      </div>

      <div className="mb-7">
        <VoorraadbewegingenCard
          data={dashboard.voorraadBewegingen ?? null}
          error={dashboard.voorraadBewegingenError ?? false}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <RecentActivityCard items={dashboard.recentActivity} />
        <ProductionCard items={dashboard.productionThisWeek} />
      </div>

      <AiSearchCard />
    </div>
  );
}
