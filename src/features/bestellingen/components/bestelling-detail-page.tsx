import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum } from "@/lib/format";
import type { BestelorderItem, BestelorderLijnItem } from "@/lib/api-client";

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

export function BestellingDetailPage({
  bestelling,
  lijnen,
}: {
  bestelling: BestelorderItem;
  lijnen: BestelorderLijnItem[];
}) {
  return (
    <div>
      <Link
        href="/bestellingen"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Bestellingen
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">
          Bestelling {bestelling.ordnr}
        </h1>
        <div className="text-[13px] text-[#5e5e5e]">{formatDatum(bestelling.datum)}</div>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Ordnr" value={String(bestelling.ordnr)} />
            <DetailField label="Datum" value={formatDatum(bestelling.datum)} />
            <DetailField label="Stempel" value={bestelling.stempel} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Leverancier" value={String(bestelling.levnr)} />
            <DetailField label="Naam" value={bestelling.naam} />
            <DetailField label="Stad" value={bestelling.stad} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Munt" value={bestelling.munt} />
            <DetailField label="Bedrag" value={formatBedrag(bestelling.bedrag)} />
            <DetailField label="Leverdatum" value={formatDatum(bestelling.levDatum)} />
            <DetailField label="Geparkeerd" value={bestelling.geparkeerd ? "Ja" : "Nee"} />
            <DetailField label="Uw referentie" value={bestelling.uRef} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <DetailField label="Opmerking" value={bestelling.opm} />
        </CardContent>
      </Card>

      <div className="mb-3 text-[15px] font-semibold text-foreground">Orderlijnen</div>

      {lijnen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen orderlijnen gevonden.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lijnnr</TableHead>
              <TableHead>Artnr</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Aantal</TableHead>
              <TableHead>Te leveren</TableHead>
              <TableHead>Inkoopprijs</TableHead>
              <TableHead>Korting</TableHead>
              <TableHead>Kost</TableHead>
              <TableHead>Leverdatum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lijnen.map((lijn) => (
              <TableRow key={lijn.lijnnr}>
                <TableCell className="font-semibold">{lijn.lijnnr}</TableCell>
                <TableCell>{lijn.artnr}</TableCell>
                <TableCell className="whitespace-normal">{lijn.omschrijving}</TableCell>
                <TableCell>{lijn.aantal}</TableCell>
                <TableCell>{lijn.teLeveren}</TableCell>
                <TableCell>{formatBedrag(lijn.vprijs)}</TableCell>
                <TableCell>{lijn.korting}</TableCell>
                <TableCell>{formatBedrag(lijn.bedrag)}</TableCell>
                <TableCell>{formatDatum(lijn.levDatum)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {lijnen.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Inkoopprijs/kost is wat aan de leverancier wordt betaald voor deze lijn - dit staat vaak
          nog op 0 omdat dit veld niet altijd wordt ingevuld bij het aanmaken van de bestelling.
        </p>
      )}
    </div>
  );
}
