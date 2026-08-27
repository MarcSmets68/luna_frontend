import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBedrag } from "@/lib/format";
import type { DashboardStatCards } from "@/lib/api-client";

type HintColor = "default" | "positive" | "warning";

type StatCard = {
  label: string;
  value: string;
  hint: string;
  hintColor?: HintColor;
};

const hintColorClass: Record<HintColor, string> = {
  default: "text-muted-foreground",
  positive: "text-primary",
  warning: "text-warning-700",
};

function buildStatCards(statCards: DashboardStatCards): StatCard[] {
  const omzetPct = statCards.omzetVsVorigeMaandPct;

  return [
    {
      // Beperkt tot offertes van de laatste 90 dagen (naast niet
      // passief/verkocht/verloren) - oudere offertes worden in de praktijk
      // niet consistent afgesloten in het systeem, zie
      // Luna.BusinessLogic.DashboardBE voor de volledige uitleg.
      label: "Open offertes",
      value: String(statCards.openOffertesCount),
      hint: `€ ${formatBedrag(statCards.openOffertesBedragPotentieel)} potentieel (laatste 90 dagen)`,
      hintColor: "positive",
    },
    {
      label: "Orders in productie",
      value: String(statCards.ordersInProductieCount),
      hint: `${statCards.ordersInProductieLeverenDezeWeek} leveren deze week`,
    },
    {
      label: "Omzet deze maand",
      value: `€ ${formatBedrag(statCards.omzetDezeMaand)}`,
      hint: omzetPct === null ? "geen data vorige maand" : `${omzetPct >= 0 ? "↑" : "↓"} ${Math.abs(omzetPct)}% vs vorige maand`,
      hintColor: omzetPct === null ? "default" : omzetPct >= 0 ? "positive" : "warning",
    },
    {
      label: "Lage voorraad",
      value: String(statCards.lageVoorraadCount),
      hint: "items onder reorder point",
      hintColor: "warning",
    },
  ];
}

export function StatCards({ statCards }: { statCards: DashboardStatCards }) {
  const cards = buildStatCards(statCards);

  return (
    <div className="mb-7 grid grid-cols-4 gap-4">
      {cards.map((stat) => (
        <Card key={stat.label} className="rounded-none border-border shadow-none">
          <CardContent className="px-5 py-1">
            <div className="mb-2 text-[11px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
              {stat.label}
            </div>
            <div
              className={cn(
                "text-[22px] font-bold whitespace-nowrap",
                stat.hintColor === "warning" ? "text-warning-700" : "text-foreground"
              )}
            >
              {stat.value}
            </div>
            <div className={cn("mt-1 text-[12px]", hintColorClass[stat.hintColor ?? "default"])}>
              {stat.hint}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
