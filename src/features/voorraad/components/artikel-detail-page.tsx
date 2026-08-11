import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBedrag, formatDatum } from "@/lib/format";
import type { ArtikelItem } from "@/lib/api-client";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-sm text-foreground">{value || "\u2014"}</div>
    </div>
  );
}

export function ArtikelDetailPage({ artikel }: { artikel: ArtikelItem }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Voorraad
      </div>
      <div className="mb-2 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">{artikel.omschrijvingNl || artikel.artnr}</h1>
        <div className="text-[13px] text-[#5e5e5e]">Artikelnr {artikel.artnr}</div>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {artikel.stock && <Badge variant="secondary">Stock</Badge>}
        {artikel.geblokkeerd && <Badge variant="destructive">Geblokkeerd</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Algemeen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Artikelnr" value={artikel.artnr} />
              <DetailField label="Merk" value={artikel.merk} />
              <DetailField label="Groep" value={artikel.groep} />
              <DetailField label="Type" value={artikel.type} />
              <DetailField label="Datum" value={formatDatum(artikel.datum)} />
              <DetailField label="Leverancier nr" value={String(artikel.leverancierNr)} />
              <DetailField label="Barcode" value={artikel.barcode} />
              <DetailField label="Omschrijving (N)" value={artikel.omschrijvingNl} />
              <DetailField label="Omschrijving (F)" value={artikel.omschrijvingFr} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prijzen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Munt" value={artikel.munt} />
              <DetailField label="BTW-kode" value={artikel.btwKode} />
              <DetailField label="Aankoopprijs" value={formatBedrag(artikel.aankoopprijs)} />
              <DetailField label="Verkoopprijs" value={formatBedrag(artikel.verkoopprijs)} />
              <DetailField label="Verkoopprijs incl." value={formatBedrag(artikel.verkoopprijsIncl)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voorraadinformatie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField label="Voorraad" value={String(artikel.voorraad)} />
              <DetailField label="Min. voorraad" value={String(artikel.voorraadMin)} />
              <DetailField label="Max. voorraad" value={String(artikel.voorraadMax)} />
              <DetailField label="Gewicht" value={String(artikel.gewicht)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
