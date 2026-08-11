import { Card, CardContent } from "@/components/ui/card";
import { formatBedrag, formatDatum } from "@/lib/format";
import type { FactuurItem } from "@/lib/api-client";

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

export function FactuurDetailPage({ factuur }: { factuur: FactuurItem }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Facturatie
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">
          Factuur {factuur.facnr}
        </h1>
        <div className="text-[13px] text-[#5e5e5e]">{formatDatum(factuur.datum)}</div>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Factuurnr" value={String(factuur.facnr)} />
            <DetailField label="Datum" value={formatDatum(factuur.datum)} />
            <DetailField label="Stempel" value={factuur.stempel} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Klantnr" value={String(factuur.klnr)} />
            <DetailField label="Naam" value={factuur.naam} />
            <DetailField label="Adres" value={factuur.adres} />
            <DetailField label="Postnr" value={factuur.postnr} />
            <DetailField label="Stad" value={factuur.stad} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Munt" value={factuur.munt} />
            <DetailField label="Netto bedrag" value={formatBedrag(factuur.nBedrag)} />
            <DetailField label="BTW-basis bedrag" value={formatBedrag(factuur.bBedrag)} />
            <DetailField label="Totaal BTW" value={formatBedrag(factuur.totBtw)} />
            <DetailField label="Totaal" value={formatBedrag(factuur.totaal)} />
            <DetailField label="Voorschot" value={formatBedrag(factuur.voorschot)} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Vervaldatum" value={formatDatum(factuur.vervaldat)} />
            <DetailField label="Betaald" value={factuur.swBetaald ? "Ja" : "Nee"} />
            <DetailField label="Betaaldatum" value={formatDatum(factuur.bdatum)} />
            <DetailField label="Factuur" value={factuur.swFactuur ? "Ja" : "Nee"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DetailField label="Opmerking" value={factuur.opm} />
        </CardContent>
      </Card>
    </div>
  );
}
