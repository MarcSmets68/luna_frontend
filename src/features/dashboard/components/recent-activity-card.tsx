import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDatum } from "@/lib/format";
import type { DashboardActivityItem } from "@/lib/api-client";

export function RecentActivityCard({ items }: { items: DashboardActivityItem[] }) {
  return (
    <Card className="rounded-none border-border shadow-none">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">Recente activiteit</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 && (
          <div className="px-5 py-3 text-[13px] text-muted-foreground">Geen recente activiteit.</div>
        )}
        {items.map((item, i) => (
          <div
            key={`${item.type}-${item.text}`}
            className={
              "flex justify-between px-5 py-3 text-[13px] " +
              (i < items.length - 1 ? "border-b border-muted" : "")
            }
          >
            <span className="text-foreground">{item.text}</span>
            <span className="ml-3 shrink-0 text-muted-foreground">{formatDatum(item.datum)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
