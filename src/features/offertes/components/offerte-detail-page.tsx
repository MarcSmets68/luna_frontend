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
import { formatBedrag, formatDatum, statusLabel } from "@/lib/format";
import { isTitleLine, TITLE_LINE_TEXT_CLASS } from "@/lib/line-classification";
import type { OfferteItem, OfflijnItem } from "@/lib/api-client";

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

export function OfferteDetailPage({
  offerte,
  lijnen,
}: {
  offerte: OfferteItem;
  lijnen: OfflijnItem[];
}) {
  return (
    <div>
      <Link
        href="/offertes/alle"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Offertes
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">
          Offerte {offerte.offnr}/{offerte.versie}
        </h1>
        <div className="text-[13px] text-[#5e5e5e]">
          Klant{" "}
          <Link href={`/klanten/${offerte.klnr}`} className="underline">
            {offerte.naam}
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Offnr" value={String(offerte.offnr)} />
            <DetailField label="Versie" value={String(offerte.versie)} />
            <DetailField label="Datum" value={formatDatum(offerte.datum)} />
            <DetailField label="Klant" value={offerte.naam} />
            <DetailField label="Status" value={statusLabel(offerte)} />
            <DetailField label="Adres" value={offerte.adres} />
            <DetailField label="Postnr" value={offerte.postnr} />
            <DetailField label="Stad" value={offerte.stad} />
            <DetailField label="Munt" value={offerte.munt} />
            <DetailField label="Bedrag" value={formatBedrag(offerte.bedrag)} />
            <DetailField label="Btw" value={formatBedrag(offerte.btw)} />
            <DetailField label="Offertegroep" value={offerte.offgroep} />
            <DetailField label="Soort" value={offerte.soort} />
            <DetailField label="Passief" value={offerte.passief ? "Ja" : "Nee"} />
            <DetailField label="Verloren" value={offerte.verloren ? "Ja" : "Nee"} />
            <DetailField label="Verkocht" value={offerte.verkocht ? "Ja" : "Nee"} />
            <DetailField label="Verkoopkans" value={String(offerte.verkoopkans)} />
            <DetailField label="Uw referentie" value={offerte.uRef} />
            <DetailField label="Besteldatum" value={formatDatum(offerte.besteldatum)} />
            <DetailField label="Verkoopdatum" value={formatDatum(offerte.verkochtdatum)} />
            <DetailField label="Opmerking" value={offerte.opm} />
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-[16px] font-semibold text-foreground">Lijnen</h2>

      {lijnen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen lijnen gevonden voor deze offerte.</p>
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
              <TableHead>Aankoopprijs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/*
              NOTE: this table has no client-side totals/footer row today. If
              one is ever added, it must aggregate over
              `excludeTitleLines(lijnen)`, not raw `lijnen` - K00 rows are
              section-title placeholders, not real articles with real amounts.
            */}
            {lijnen.map((lijn) => {
              const isTitle = isTitleLine(lijn.artnr);
              return (
                <TableRow key={lijn.lijnnr}>
                  <TableCell className={cn("font-semibold", isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.lijnnr}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.artnr}
                  </TableCell>
                  <TableCell className={cn("whitespace-normal", isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.omschrijvingOfferte || lijn.omschrijving}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.aantal}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.teLeveren}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {formatBedrag(lijn.verkoopprijs)}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {lijn.korting}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {formatBedrag(lijn.bedrag)}
                  </TableCell>
                  <TableCell className={cn(isTitle && TITLE_LINE_TEXT_CLASS)}>
                    {formatBedrag(lijn.aankoopprijs)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
