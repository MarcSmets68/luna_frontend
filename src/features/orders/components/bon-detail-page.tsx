"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityDetailHeader } from "@/components/ui/entity-detail-header";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum } from "@/lib/format";
import { isTitleLine, TITLE_LINE_TEXT_CLASS } from "@/lib/line-classification";
import { BonLijnFoutBanner } from "./bon-lijn-fout-banner";
import type { BonItem, BonLijnItem } from "@/lib/api-client";
import { BonlijnProductieTable } from "./bonlijn-productie-table";
import { BonlijnReserveringDialog } from "./bonlijn-reservering-dialog";
import { BonlijnPakbonBadge } from "./bonlijn-pakbon-badge";
import { LedConfigTable } from "./led-config-table";
import { LedQcTable } from "./led-qc-table";
import { HerstelDetailPanel } from "./herstel-detail-panel";
import { BonDetailEditDialog } from "./bon-detail-edit-dialog";
import { PakbonAanmakenDialog } from "./pakbon-aanmaken-dialog";

const LIJNEN_TABLE_COLUMN_COUNT = 13;

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

export function BonDetailPage({
  bon: initialBon,
  lijnen,
}: {
  bon: BonItem;
  lijnen: BonLijnItem[];
}) {
  const router = useRouter();
  // Local copy of the server state so a reservering-call's response can
  // refresh a single row without a full page re-fetch.
  const [bon, setBon] = useState<BonItem>(initialBon);
  const [rows, setRows] = useState<BonLijnItem[]>(lijnen);
  const [expandedLijnnr, setExpandedLijnnr] = useState<number | null>(null);
  const [reserveringTarget, setReserveringTarget] = useState<BonLijnItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pakbonDialogOpen, setPakbonDialogOpen] = useState(false);
  const isHerstelling = bon.type === "HERSTELLING";

  const heeftExtraKlantnrs = Boolean(bon.klnr2) || Boolean(bon.klnr3);
  const heeftAfleveradres = Boolean(
    bon.lnaam || bon.lnaam1 || bon.ladres || bon.lpostnr || bon.lstad
  );

  function handleReserved(updated: BonLijnItem) {
    setRows((prev) => prev.map((row) => (row.lijnnr === updated.lijnnr ? updated : row)));
  }

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

      <EntityDetailHeader title={`Bon ${bon.bonnr}`} />

      <div className="mb-3 -mt-6 text-[13px] text-[#5e5e5e]">
        Klant{" "}
        <Link href={`/klanten/${bon.klnr}`} className="underline">
          {bon.naam}
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Ordergegevens
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Bewerken
          </Button>
        </CardHeader>
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

          {heeftExtraKlantnrs && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  Extra klantnummers
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Boolean(bon.klnr2) && <DetailField label="Klnr2" value={String(bon.klnr2)} />}
                  {Boolean(bon.klnr3) && <DetailField label="Klnr3" value={String(bon.klnr3)} />}
                </div>
              </div>
            </>
          )}

          {heeftAfleveradres && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  Afleveradres
                </div>
                <div className="text-sm text-foreground">
                  {bon.lnaam && <div>{bon.lnaam}</div>}
                  {bon.lnaam1 && <div>{bon.lnaam1}</div>}
                  {bon.ladres && <div>{bon.ladres}</div>}
                  {(bon.lpostnr || bon.lstad) && (
                    <div>{[bon.lpostnr, bon.lstad].filter(Boolean).join(" ")}</div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator className="my-4" />
          <div>
            <div className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Bedragen (extra)
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Recupel bedrag" value={formatBedrag(bon.recupelBedrag)} />
              <DetailField label="A-bedrag" value={formatBedrag(bon.aBedrag)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lijnen">
        <TabsList>
          <TabsTrigger value="lijnen">Lijnen</TabsTrigger>
          <TabsTrigger value="led">LED-configuratie</TabsTrigger>
          {isHerstelling && <TabsTrigger value="herstel">Herstel</TabsTrigger>}
        </TabsList>

        <TabsContent value="lijnen">
          <BonLijnFoutBanner bonnr={bon.bonnr} />

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-foreground">Lijnen</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={rows.length === 0}
              onClick={() => setPakbonDialogOpen(true)}
            >
              Pakbon aanmaken
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen lijnen gevonden voor deze order.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Lijnnr</TableHead>
                  <TableHead>Artnr</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead>Aantal</TableHead>
                  <TableHead>Te leveren</TableHead>
                  <TableHead>Gereserveerd</TableHead>
                  <TableHead>Eff. gereserveerd</TableHead>
                  <TableHead>Vprijs</TableHead>
                  <TableHead>Korting</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Leverdatum</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {/*
                  NOTE: this table has no client-side totals/footer row today. If
                  one is ever added, it must aggregate over
                  `excludeTitleLines(rows)`, not raw `rows` - K00 rows are
                  section-title placeholders, not real articles with real amounts.
                */}
                {rows.map((lijn) => {
                  const isTitle = isTitleLine(lijn.artnr);
                  if (isTitle) {
                    return (
                      <TableRow key={lijn.lijnnr}>
                        <TableCell
                          colSpan={LIJNEN_TABLE_COLUMN_COUNT}
                          className={cn("whitespace-normal", TITLE_LINE_TEXT_CLASS)}
                        >
                          {lijn.omschrijving}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const isExpanded = expandedLijnnr === lijn.lijnnr;
                  return (
                    <Fragment key={lijn.lijnnr}>
                      <TableRow>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={
                              isExpanded
                                ? `Verberg productie-sublijnen van lijn ${lijn.lijnnr}`
                                : `Toon productie-sublijnen van lijn ${lijn.lijnnr}`
                            }
                            onClick={() => setExpandedLijnnr(isExpanded ? null : lijn.lijnnr)}
                          >
                            {isExpanded ? <ChevronDown /> : <ChevronRight />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-semibold">{lijn.lijnnr}</TableCell>
                        <TableCell>{lijn.artnr}</TableCell>
                        <TableCell className="whitespace-normal">
                          {lijn.omschrijving}
                          <BonlijnPakbonBadge bonnr={bon.bonnr} lijnnr={lijn.lijnnr} />
                        </TableCell>
                        <TableCell>{lijn.aantal}</TableCell>
                        <TableCell>{lijn.teLeveren}</TableCell>
                        <TableCell
                          className={cn(
                            lijn.swEffectief &&
                              lijn.teLeveren > lijn.gereserv &&
                              "bg-amber-100 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          )}
                        >
                          {lijn.gereserv}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lijn.swEffectief ? "default" : "outline"}>
                            {lijn.effectiefGereserv}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatBedrag(lijn.vprijs)}</TableCell>
                        <TableCell>{lijn.korting}</TableCell>
                        <TableCell>{formatBedrag(lijn.bedrag)}</TableCell>
                        <TableCell>{formatDatum(lijn.levDatum)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setReserveringTarget(lijn)}
                          >
                            Reserveren
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={LIJNEN_TABLE_COLUMN_COUNT} className="bg-muted/20">
                            <BonlijnProductieTable bonnr={bon.bonnr} blijnnr={lijn.lijnnr} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="led">
          <LedConfigTable bonnr={bon.bonnr} />
          <LedQcTable bonnr={bon.bonnr} />
        </TabsContent>

        {isHerstelling && (
          <TabsContent value="herstel">
            <HerstelDetailPanel bonnr={bon.bonnr} />
          </TabsContent>
        )}
      </Tabs>

      {pakbonDialogOpen && (
        <PakbonAanmakenDialog
          bon={bon}
          lijnen={rows}
          open={pakbonDialogOpen}
          onOpenChange={setPakbonDialogOpen}
        />
      )}

      {reserveringTarget && (
        <BonlijnReserveringDialog
          bonnr={bon.bonnr}
          lijn={reserveringTarget}
          open={reserveringTarget !== null}
          onOpenChange={(open) => {
            if (!open) setReserveringTarget(null);
          }}
          onReserved={(updated) => {
            handleReserved(updated);
            setReserveringTarget(null);
          }}
        />
      )}
    </div>
  );
}
