import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardVoorraadBewegingen } from "@/lib/api-client";

const nf = (n: number) => n.toLocaleString("nl-BE", { maximumFractionDigits: 2 });

export function VoorraadbewegingenCard({
  data,
  error,
}: {
  data: DashboardVoorraadBewegingen | null;
  error: boolean;
}) {
  const items = data?.topDalers ?? [];
  const empty = !data || data.aantalIn + data.aantalUit === 0;

  return (
    <Card className="rounded-none border-border shadow-none">
      <CardHeader className="border-b border-border py-3.5">
        <CardTitle className="text-sm font-semibold text-foreground">Voorraadbewegingen</CardTitle>
        <div className="text-[11px] text-muted-foreground">boekingen deze maand tot nu toe</div>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="px-5 py-3 text-[13px] text-destructive">Kon voorraadbewegingen niet laden.</div>
        )}
        {!error && empty && (
          <div className="px-5 py-3 text-[13px] text-muted-foreground">Nog geen voorraadbewegingen deze maand.</div>
        )}
        {!error && !empty && data && (
          <>
            <div className="grid grid-cols-3 border-b border-border px-5 py-3">
              {[
                ["Boekingen in", data.aantalIn],
                ["Boekingen uit", data.aantalUit],
                ["Artikelen met beweging", data.aantalArtikelen],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                  <div className="text-[13px] font-semibold text-foreground">
                    {(value as number).toLocaleString("nl-BE")}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pt-3 pb-1 text-[11px] text-muted-foreground">
              Grootste voorraaddaling (excl. stocktellingen en geblokkeerde artikelen)
            </div>
            {items.length === 0 && (
              <div className="px-5 py-3 text-[13px] text-muted-foreground">
                Geen artikelen met een netto voorraaddaling deze maand.
              </div>
            )}
            {items.map((item, i) => (
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
                  <div className="font-semibold text-foreground">{nf(item.netto)}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {item.aantalBewegingen.toLocaleString("nl-BE")} boekingen · voorraad {nf(item.huidigeVoorraad)}
                    {item.voorraadMin > 0 && ` (min. ${nf(item.voorraadMin)})`}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
