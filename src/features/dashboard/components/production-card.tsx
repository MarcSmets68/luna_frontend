import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBedrag, formatDatum } from "@/lib/format";
import type { DashboardProductionItem } from "@/lib/api-client";

/*
 * Shows open bonnen (bon.geparkeerd = false, bon.verzonden = false, hence
 * always "Openstaand" here) due this week. There is no production-stage
 * concept in the schema (bonlijn_productie only tracks material
 * reservation per orderlijn, not a workflow stage - confirmed with Marc
 * 2026-08-12), so this deliberately doesn't show a Design/Materiaal/
 * Assemblage/QC/Verzonden badge like the earlier mockup did.
 */
export function ProductionCard({ items }: { items: DashboardProductionItem[] }) {
  return (
    <Card className="rounded-none border-border shadow-none">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">Productie deze week</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 && (
          <div className="px-5 py-3 text-[13px] text-muted-foreground">Geen orders deze week.</div>
        )}
        {items.map((order, i) => (
          <div
            key={order.bonnr}
            className={"px-5 py-2.75 " + (i < items.length - 1 ? "border-b border-muted" : "")}
          >
            <div className="flex justify-between text-[12.5px] font-semibold text-foreground">
              <span>{order.bonnr}</span>
              <span className="font-normal text-muted-foreground">{formatDatum(order.leverdatum)}</span>
            </div>
            <div className="mt-0.5 text-[12px] text-[#5e5e5e]">{order.klant}</div>
            <div className="mt-0.5 text-[12px] text-[#5e5e5e]">€ {formatBedrag(order.bedrag)}</div>
            <Badge className="mt-1.5 rounded-none border-none bg-secondary px-1.75 py-0.5 text-[10.5px] font-bold tracking-[0.03em] text-[#5e5e5e]">
              Openstaand
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
