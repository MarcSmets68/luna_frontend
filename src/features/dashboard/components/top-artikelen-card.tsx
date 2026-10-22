import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/format";
import type { DashboardTopArtikelItem } from "@/lib/api-client";
import { VsVorigeMaand } from "./vs-vorige-maand";

export function TopArtikelenCard({ items, error }: { items: DashboardTopArtikelItem[]; error: boolean }) {
  return (
    <Card className="rounded-none border-border shadow-none">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">Top 5 artikelen</CardTitle>
        <div className="text-[11px] text-muted-foreground">netto excl. BTW, deze maand tot nu toe</div>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="px-5 py-3 text-[13px] text-destructive">Kon top artikelen niet laden.</div>
        )}
        {!error && items.length === 0 && (
          <div className="px-5 py-3 text-[13px] text-muted-foreground">Nog geen facturen deze maand.</div>
        )}
        {!error &&
          items.map((item, i) => (
            <div
              key={item.artnr}
              className={
                "flex items-start justify-between gap-3 px-5 py-3 text-[13px] " +
                (i < items.length - 1 ? "border-b border-muted" : "")
              }
            >
              <div className="flex min-w-0 gap-3">
                <span className="w-4 shrink-0 text-muted-foreground">{item.rang}</span>
                <div className="min-w-0">
                  <div className="truncate text-[#444444]">{item.omschrijving}</div>
                  <div className="text-[11px] text-muted-foreground">{item.artnr}</div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold text-foreground">€ {formatBedrag(item.omzet)}</div>
                <div className="text-[11px] text-muted-foreground">
                  {item.aandeelPct.toLocaleString("nl-BE", { maximumFractionDigits: 1 })}% ·{" "}
                  {item.aantal.toLocaleString("nl-BE", { maximumFractionDigits: 2 })} stuks
                </div>
                <VsVorigeMaand value={item.vsVorigeMaandPct} />
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
