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
import type { BonItem, BonLijnItem } from "@/lib/api-client";

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

export function BonDetailPage({ bon, lijnen }: { bon: BonItem; lijnen: BonLijnItem[] }) {
  return (
    <div>
      <Link
        href="/orders/alle"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Orders &amp; Productie
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Bon {bon.bonnr}</h1>
        <div className="text-[13px] text-[#5e5e5e]">
          Klant{" "}
          <Link href={`/klanten/${bon.klnr}`} className="underline">
            {bon.naam}
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Bonnr" value={String(bon.bonnr)} />
            <DetailField label="Type" value={bon.type} />
            <DetailField label="Datum" value={formatDatum(bon.datum)} />
            <DetailField label="Klant" value={bon.naam} />
            <DetailField label="Adres" value={bon.adres} />
            <DetailField label="Postnr" value={bon.postnr} />
            <DetailField label="Stad" value={bon.stad} />
            <DetailField label="Munt" value={bon.munt} />
            <DetailField label="Bedrag" value={formatBedrag(bon.bedrag)} />
            <DetailField label="Btw" value={formatBedrag(bon.btw)} />
            <DetailField label="Uw referentie" value={bon.uRef} />
            <DetailField label="Besteldatum" value={formatDatum(bon.besteldatum)} />
            <DetailField label="Leverdatum" value={formatDatum(bon.levDatum)} />
            <DetailField label="Geparkeerd" value={bon.geparkeerd ? "Ja" : "Nee"} />
            <DetailField label="Verzonden" value={bon.verzonden ? "Ja" : "Nee"} />
            <DetailField label="Opmerking" value={bon.opm} />
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-[16px] font-semibold text-foreground">Lijnen</h2>

      {lijnen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen lijnen gevonden voor deze order.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lijnnr</TableHead>
              <TableHead>Artnr</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Aantal</TableHead>
              <TableHead>Te leveren</TableHead>
              <TableHead>Vprijs</TableHead>
              <TableHead>Korting</TableHead>
              <TableHead>Bedrag</TableHead>
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
    </div>
  );
}
