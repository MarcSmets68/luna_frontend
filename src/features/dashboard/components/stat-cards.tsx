import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
  href?: string;
  linkLabel?: string;
};

const hintColorClass: Record<HintColor, string> = {
  default: "text-muted-foreground",
  positive: "text-primary-600",
  warning: "text-warning-fg",
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
      href: "/offertes/alle",
      linkLabel: "Alle offertes bekijken",
    },
    {
      label: "Orders in productie",
      value: String(statCards.ordersInProductieCount),
      hint: `${statCards.ordersInProductieLeverenDezeWeek} leveren deze week`,
      href: "/orders/alle",
      linkLabel: "Alle orders bekijken",
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
      href: "/voorraad?lageVoorraad=true",
      linkLabel: "Gefilterde voorraadlijst bekijken",
    },
  ];
}

export function StatCards({ statCards }: { statCards: DashboardStatCards }) {
  const cards = buildStatCards(statCards);

  return (
    <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((stat) => {
        const card = (
          <Card
            className={cn(
              "h-full border-t-2 border-t-primary/50",
              stat.href && "cursor-pointer transition-colors hover:border-primary hover:bg-muted/40"
            )}
          >
            <CardContent className="px-5 py-1">
              <div className="mb-3 text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
                {stat.label}
              </div>
              <div
                className={cn(
                  "text-[28px] leading-tight font-semibold tracking-tight whitespace-nowrap tabular-nums",
                  stat.hintColor === "warning" ? "text-warning-fg" : "text-foreground"
                )}
              >
                {stat.value}
              </div>
              <div className={cn("mt-1 text-[12px]", hintColorClass[stat.hintColor ?? "default"])}>
                {stat.hint}
              </div>
              {stat.linkLabel && <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary">{stat.linkLabel}<ArrowUpRight aria-hidden="true" className="size-3.5" /></div>}
            </CardContent>
          </Card>
        );

        return stat.href ? (
          <Link
            key={stat.label}
            href={stat.href}
            aria-label={`${stat.label}: ${stat.linkLabel}`}
            className="rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {card}
          </Link>
        ) : (
          <div key={stat.label}>{card}</div>
        );
      })}
    </div>
  );
}
