"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityDetailHeader } from "@/components/ui/entity-detail-header";
import { FlagGrid } from "@/components/ui/flag-grid";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum } from "@/lib/format";
import { isTitleLine, TITLE_LINE_TEXT_CLASS } from "@/lib/line-classification";
import { BonLijnFoutBanner } from "./bon-lijn-fout-banner";
import { updateBon, type BonItem, type BonLijnItem, type UpdateBonPayload } from "@/lib/api-client";
import { BonlijnProductieTable } from "./bonlijn-productie-table";
import { BonlijnReserveringDialog } from "./bonlijn-reservering-dialog";
import { BonlijnPakbonBadge } from "./bonlijn-pakbon-badge";
import { PakbonAanmakenDialog } from "./pakbon-aanmaken-dialog";
import { LedConfigTable } from "./led-config-table";
import { LedQcTable } from "./led-qc-table";
import { HerstelDetailPanel } from "./herstel-detail-panel";

// Column count of the "Lijnen" table body: chevron, Lijnnr, Artnr,
// Omschrijving, Aantal, Te leveren, Gereserveerd, Eff. gereserveerd, Vprijs,
// Korting, Bedrag, Leverdatum, actie (Reserveren). A collapsed K00 title row
// merges every one of these into a single cell.
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

// Kept 1:1 alongside offerte-detail-page.tsx's own DetailField/EditField
// pair rather than hoisted to a shared component - see handoff note in the
// PR: bon's read-only DetailField layout (stacked label/value) differs
// from offerte's (inline grid-cols), so a shared component would need an
// extra layout prop or a visual change to one of the two pages. Kept as a
// small, deliberate duplication instead.
function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 font-normal normal-case"
      />
    </label>
  );
}

// Bewerkbare velden op de bonkaart - `bonnr` (identificatie, immutable) en
// `bedrag`/`btw` (server-berekend, niet op deze pagina herberekend) horen
// hier bewust niet bij; zie docs/backend/bon.md's field map voor de volledige
// writable-lijst.
//
// frontend-tester fix (zie test-report): `klnr` en `stempel` staan in dat
// field map wel als "Yes" writable via de API, maar zijn hier bewust NIET
// als vrij-tekst-editable veld opgenomen, ondanks dat een eerdere versie van
// deze pagina dat wel deed:
// - `stempel` is workflow-kritisch - het stuurt de `PUT .../lijn`
//   `stempel="D"`-guard en de `POST .../annuleer`-voorwaarde
//   (`stempel` moet `"V"`/`"B"` zijn) op de backend. Een gebruiker die dit
//   naar een willekeurige waarde typt kan de order in een inconsistente
//   staat brengen zonder enige validatie. Offerte's eigen vergelijkbare
//   workflow-velden (`verloren`/`verkocht`) zijn nooit vrij-tekst - het zijn
//   `FlagGrid`-toggles met server-side auto-clear-logica. Bon heeft nog geen
//   toggle-equivalent voor `stempel`, dus tot die er is blijft dit veld
//   read-only, net als `bonnr`/`bedrag`/`btw`.
// - `klnr` is offerte's eigen `klnr` altijd immutable/identificatie
//   (zie offerte-detail-page.tsx). Bon los daarvan editable maken zou de
//   twee analoge detailpagina's laten verschillen zonder functionele
//   aanleiding in de opdracht voor deze feature - teruggedraaid naar
//   read-only voor consistentie.
type BonFormState = {
  type: string;
  datum: string;
  naam: string;
  adres: string;
  postnr: string;
  stad: string;
  munt: string;
  uRef: string;
  besteldatum: string;
  levDatum: string;
  opm: string;
  geparkeerd: boolean;
  verzonden: boolean;
};

function toBonFormState(bon: BonItem): BonFormState {
  return {
    type: bon.type,
    datum: bon.datum ?? "",
    naam: bon.naam,
    adres: bon.adres,
    postnr: bon.postnr,
    stad: bon.stad,
    munt: bon.munt,
    uRef: bon.uRef,
    besteldatum: bon.besteldatum ?? "",
    levDatum: bon.levDatum ?? "",
    opm: bon.opm,
    geparkeerd: bon.geparkeerd,
    verzonden: bon.verzonden,
  };
}

export function BonDetailPage({ bon, lijnen }: { bon: BonItem; lijnen: BonLijnItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Local copy of the server state so a reservering-call's response can
  // refresh a single row without a full page re-fetch.
  const [rows, setRows] = useState<BonLijnItem[]>(lijnen);
  const [expandedLijnnr, setExpandedLijnnr] = useState<number | null>(null);
  const [reserveringTarget, setReserveringTarget] = useState<BonLijnItem | null>(null);
  const [pakbonDialogOpen, setPakbonDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BonFormState>(() => toBonFormState(bon));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isHerstelling = bon.type === "HERSTELLING";

  // Auto-enter edit mode when redirected here from a successful
  // offerte -> order conversion (offerte-detail-page's "Omzetten naar
  // Order" button pushes `/orders/{bonnr}?edit=1`) - a one-time intent
  // flag, not a derived-state sync loop, mirrors the `lijnFout=1` pattern
  // used elsewhere on this page/offerte-detail-page.
  useEffect(() => {
    if (searchParams.get("edit") !== "1") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(toBonFormState(bon));
    setError(null);
    setEditing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = useMemo(() => {
    const original = toBonFormState(bon);
    return (Object.keys(original) as (keyof BonFormState)[]).some(
      (key) => original[key] !== form[key]
    );
  }, [bon, form]);

  const setField = <K extends keyof BonFormState>(key: K, value: BonFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function startEditing() {
    setForm(toBonFormState(bon));
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(toBonFormState(bon));
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: UpdateBonPayload = {
        type: form.type,
        datum: form.datum || undefined,
        naam: form.naam,
        adres: form.adres,
        postnr: form.postnr,
        stad: form.stad,
        munt: form.munt,
        uRef: form.uRef,
        besteldatum: form.besteldatum || undefined,
        levDatum: form.levDatum || undefined,
        opm: form.opm,
        geparkeerd: form.geparkeerd,
        verzonden: form.verzonden,
      };
      await updateBon(bon.bonnr, payload);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de bon.");
    } finally {
      setSaving(false);
    }
  }

  const headerActions = editing ? (
    <>
      <Button type="button" variant="outline" onClick={cancelEditing} disabled={saving}>
        Cancel
      </Button>
      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Bezig..." : "Save"}
      </Button>
    </>
  ) : (
    <Button type="button" size="sm" onClick={startEditing}>
      Verbeteren
    </Button>
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

      <EntityDetailHeader
        title={`Bon ${bon.bonnr}`}
        subtitle={undefined}
        dirty={editing && isDirty}
        actions={headerActions}
      />

      <div className="mb-3 -mt-6 text-[13px] text-[#5e5e5e]">
        Klant{" "}
        <Link href={`/klanten/${bon.klnr}`} className="underline">
          {bon.naam}
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent>
          {editing ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Bonnr" value={String(bon.bonnr)} />
                <EditField label="Type" value={form.type} onChange={(v) => setField("type", v)} />
                <DetailField label="Stempel" value={bon.stempel} />
                <EditField
                  label="Datum"
                  value={form.datum}
                  onChange={(v) => setField("datum", v)}
                  type="date"
                />
                <DetailField label="Klnr" value={String(bon.klnr)} />
                <EditField label="Klant" value={form.naam} onChange={(v) => setField("naam", v)} />
                <EditField label="Adres" value={form.adres} onChange={(v) => setField("adres", v)} />
                <EditField
                  label="Postnr"
                  value={form.postnr}
                  onChange={(v) => setField("postnr", v)}
                />
                <EditField label="Stad" value={form.stad} onChange={(v) => setField("stad", v)} />
                <EditField label="Munt" value={form.munt} onChange={(v) => setField("munt", v)} />
                <DetailField label="Bedrag" value={formatBedrag(bon.bedrag)} />
                <DetailField label="Btw" value={formatBedrag(bon.btw)} />
                <EditField
                  label="Uw referentie"
                  value={form.uRef}
                  onChange={(v) => setField("uRef", v)}
                />
                <EditField
                  label="Besteldatum"
                  value={form.besteldatum}
                  onChange={(v) => setField("besteldatum", v)}
                  type="date"
                />
                <EditField
                  label="Leverdatum"
                  value={form.levDatum}
                  onChange={(v) => setField("levDatum", v)}
                  type="date"
                />
                <EditField label="Opmerking" value={form.opm} onChange={(v) => setField("opm", v)} />
              </div>

              <div className="mt-6">
                <FlagGrid
                  title="Kenmerken"
                  items={[
                    {
                      key: "geparkeerd",
                      label: "Geparkeerd",
                      checked: form.geparkeerd,
                      onToggle: () => setField("geparkeerd", !form.geparkeerd),
                    },
                    {
                      key: "verzonden",
                      label: "Verzonden",
                      checked: form.verzonden,
                      onToggle: () => setField("verzonden", !form.verzonden),
                    },
                  ]}
                />
              </div>

              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Bonnr" value={String(bon.bonnr)} />
                <DetailField label="Type" value={bon.type} />
                <DetailField label="Stempel" value={bon.stempel} />
                <DetailField label="Datum" value={formatDatum(bon.datum)} />
                <DetailField label="Klnr" value={String(bon.klnr)} />
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
                <DetailField label="Opmerking" value={bon.opm} />
              </div>

              <div className="mt-6">
                <FlagGrid
                  title="Kenmerken"
                  items={[
                    {
                      key: "geparkeerd",
                      label: "Geparkeerd",
                      checked: bon.geparkeerd,
                      onToggle: () => {},
                      disabled: true,
                    },
                    {
                      key: "verzonden",
                      label: "Verzonden",
                      checked: bon.verzonden,
                      onToggle: () => {},
                      disabled: true,
                    },
                  ]}
                />
              </div>
            </>
          )}
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
