import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDatum } from "@/lib/format";
import type { DashboardActivityItem } from "@/lib/api-client";

const destinations = {
  offerte: { href: "/offertes/alle", label: "alle offertes" },
  bon: { href: "/orders/alle", label: "alle orders" },
  factuur: { href: "/facturatie/alle", label: "alle facturen" },
};

export function RecentActivityCard({ items }: { items: DashboardActivityItem[] }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">Recente activiteit</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 && (
          <div className="px-5 py-3 text-[13px] text-muted-foreground">Geen recente activiteit.</div>
        )}
        {items.map((item, i) => (
          <Link
            key={`${item.type}-${item.text}`}
            href={destinations[item.type].href}
            aria-label={`${item.text}: bekijk ${destinations[item.type].label}`}
            className={
              "flex items-start justify-between px-5 py-3 text-[13px] transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring " +
              (i < items.length - 1 ? "border-b border-muted" : "")
            }
          >
            <span className="text-[#444444]">{item.text}<ArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5 text-primary" /></span>
            <span className="ml-3 shrink-0 text-muted-foreground">{formatDatum(item.datum)}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
