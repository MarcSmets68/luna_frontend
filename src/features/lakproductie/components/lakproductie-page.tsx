"use client";

import { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { LakproductieItem } from "@/lib/api-client";
import { getColorHex } from "../colorMap";
import { mapToAxaltaColor } from "../colorMapping";
import { PrintButton } from "./print-button";
import { BronBadge, StatusBadge } from "./bron-badge";
import { LakproductieDetailDialog } from "./lakproductie-detail-dialog";
import { BestellingPreviewDialog } from "./bestelling-preview-dialog";
import {
  ALLE_BRONNEN,
  ALLE_LEVERANCIERS,
  DEFAULT_LAKPRODUCTIE_FILTERS,
  LakproductieFilters,
  type LakproductieFiltersState,
} from "./lakproductie-filters";

// Overrides voor Aantal/Leverancier per orderregel - enkel lokaal in de
// front-end bijgehouden (niet persistent, niet naar de backend
// geschreven): "Aantal" is bij "lopende-orders"/"lopende-productielijnen"
// afgeleid van de echte order/productielijn en "Leverancier" geldt
// vandaag per behandelingscode voor alle orders met die behandeling -
// deze override raakt dus bewust geen van beide aan, zie
// lakproductie-filters.tsx/lakproductie-page.tsx overleg met Marc.
type LakproductieOverride = {
  aantal?: number;
  lakNaam?: string;
};

// Stabiele sleutel per orderregel, ongeacht bron: (a) lopende-orders =
// bonnr+lijnnr, (b) lopende-productielijnen = bonnr+lijnnr+prodLijnnr,
// (c) min-max-voorraad = artnr (er is geen order/productielijn-context).
function lineKey(item: LakproductieItem): string {
  return [item.bron, item.bonnr ?? "", item.lijnnr ?? "", item.prodLijnnr ?? "", item.artnr].join(
    "|"
  );
}

function applyOverride(
  item: LakproductieItem,
  overrides: Record<string, LakproductieOverride>
): LakproductieItem {
  const override = overrides[lineKey(item)];
  if (!override) return item;
  return {
    ...item,
    aantal: override.aantal ?? item.aantal,
    lakNaam: override.lakNaam ?? item.lakNaam,
  };
}

// Vaste kolombreedtes zodat de kolommen tussen de losse groepstabellen
// (elke kleur/techniek/afwerking-groep krijgt zijn eigen <Table>) exact
// onder elkaar blijven staan, ongeacht de inhoud van die groep.
const COL_BRON = "w-[92px]";
const COL_ORDER = "w-[92px]";
const COL_ARTIKEL = "w-[170px]";
// 20% kleiner dan de voordien gebruikte breedte (400px -> 320px).
const COL_OMSCHRIJVING = "w-[320px]";
const COL_AANTAL = "w-[72px]";
const COL_VERPAKKING = "w-[92px]";
const COL_LEVERANCIER = "w-[140px]";
const COL_STATUS = "w-[170px]";

const DASH = "\u2014";

function formatQty(value: number | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function groupBy(
  items: LakproductieItem[],
  keyOf: (item: LakproductieItem) => string
): Map<string, LakproductieItem[]> {
  const groups = new Map<string, LakproductieItem[]>();
  for (const item of items) {
    const key = keyOf(item) || "Onbekend";
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

// Top-level grouping: every article that will get the exact same treatment
// (techniek + kleurkode + afwerking) belongs together, regardless of which
// of the many raw artikel.led-coating specs ("behandeling") produced that
// combination - groepeerKleur already IS that combination (with a
// fallback to the raw behandeling code when nothing could be derived from
// it, per LakproductieBE.BuildGroepeerKleurLabel), so it's the right key.
function groupByKleurTechniekAfwerking(items: LakproductieItem[]): Map<string, LakproductieItem[]> {
  return groupBy(items, (item) => item.groepeerKleur || item.behandeling);
}

// Subgroup within a kleur/techniek/afwerking group: per leverancier (bv.
// "ANO · Brons" kan uit meerdere leveranciers bestaan, elk als eigen
// subgroep) - gebruikt de effectieve (eventueel lokaal overschreven)
// lakNaam, zodat een lijn meteen naar de juiste leverancier-subgroep
// verhuist zodra die override wordt aangepast.
function groupByLeverancier(items: LakproductieItem[]): Map<string, LakproductieItem[]> {
  return groupBy(items, (item) => item.lakNaam);
}

function matchesFilters(item: LakproductieItem, filters: LakproductieFiltersState): boolean {
  if (filters.bron !== ALLE_BRONNEN && item.bron !== filters.bron) return false;
  if (filters.leverancier !== ALLE_LEVERANCIERS && item.lakNaam !== filters.leverancier) {
    return false;
  }
  if (filters.order.trim() !== "") {
    if (!item.bonnr || !String(item.bonnr).includes(filters.order.trim())) return false;
  }
  return true;
}

// Min-max-voorraad-artikel waarvan de verkoop van de laatste 6 maanden
// lager is dan de huidige voorraad (of zelfs helemaal 0, ongeacht de
// voorraad - dan is er sowieso geen verkoop geweest): dit artikel
// verkoopt trager dan het op voorraad ligt, dus hoeft (voorlopig) niet
// meegenomen te worden in een eventuele bestelling.
function isTraagMinMaxArtikel(item: LakproductieItem): boolean {
  if (item.bron !== "min-max-voorraad") return false;
  return item.verkoop6Maand === 0 || item.verkoop6Maand < item.voorraad;
}

// Bestelling-preview-dialog werkt op een volledige leverancier-subgroep
// (kleurgroep + leverancier) tegelijk - dit is exact de knop-granulariteit
// die gevraagd is ("bij elke leveranciergroep bij een bepaalde kleur een
// button om een nieuwe bestelling aan te maken").
type BestellingGroep = {
  // Uniek per klik (niet enkel leverancier+levnr, want dezelfde
  // leverancier kan in meerdere kleurgroepen voorkomen) - gebruikt als
  // React `key` op de dialog zodat die bij elke nieuwe groep met verse
  // state remount i.p.v. op oudere state verder te bouwen.
  id: string;
  leverancier: string;
  levnr: number | null;
  items: LakproductieItem[];
};

export function LakproductiePage({ items }: { items: LakproductieItem[] }) {
  const [selectedItem, setSelectedItem] = useState<LakproductieItem | null>(null);
  const [filters, setFilters] = useState<LakproductieFiltersState>(DEFAULT_LAKPRODUCTIE_FILTERS);
  const [overrides, setOverrides] = useState<Record<string, LakproductieOverride>>({});
  const [bestellingGroep, setBestellingGroep] = useState<BestellingGroep | null>(null);
  const [hideTraagMinMax, setHideTraagMinMax] = useState(false);

  const setOverride = (item: LakproductieItem, patch: LakproductieOverride) => {
    setOverrides((prev) => ({
      ...prev,
      [lineKey(item)]: { ...prev[lineKey(item)], ...patch },
    }));
  };

  const leveranciers = [...new Set(items.map((item) => item.lakNaam).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  );
  // Overrides eerst toepassen, zodat filteren/groeperen/renderen overal
  // consistent met de (eventueel lokaal aangepaste) waarden gebeurt - een
  // lijn verhuist dus meteen naar de juiste leverancier-subgroep zodra je
  // die override aanpast.
  const effectiveItems = items.map((item) => applyOverride(item, overrides));
  const filteredItems = effectiveItems
    .filter((item) => matchesFilters(item, filters))
    .filter((item) => !hideTraagMinMax || !isTraagMinMaxArtikel(item));
  const groups = groupByKleurTechniekAfwerking(filteredItems);

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Productie
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Lakproduktie</h1>
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-[#5e5e5e]">{filteredItems.length} orderregels</div>
          <Button
            type="button"
            variant={hideTraagMinMax ? "default" : "outline"}
            size="sm"
            onClick={() => setHideTraagMinMax((prev) => !prev)}
          >
            {hideTraagMinMax
              ? "Toon trage min-max artikelen"
              : "Verberg trage min-max artikelen"}
          </Button>
          <PrintButton />
        </div>
      </div>

      <LakproductieFilters
        filters={filters}
        onFiltersChange={setFilters}
        leveranciers={leveranciers}
      />

      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {items.length === 0
            ? "Geen artikelen gevonden die nog gelakt of geanodiseerd moeten worden."
            : "Geen orderregels gevonden voor de huidige filters."}
        </p>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([kleurGroepLabel, groupItems]) => {
            const subgroups = groupByLeverancier(groupItems);
            // Alle items in een groep hebben dezelfde afgeleide kleursoort/
            // kleurkode (dat is precies wat groepeerKleur samenvat), dus het
            // eerste item volstaat om de kleurstip te bepalen.
            const colorHex = getColorHex(groupItems[0].kleursoort, groupItems[0].kleurkode);
            // "RAL 1".."RAL 5" zijn geen echte RAL-kleuren maar interne
            // codes die om historische reden zo genoemd zijn - toon in dat
            // geval de echte leverancier-productnaam/-code erbij.
            const axaltaColor = mapToAxaltaColor(groupItems[0].kleursoort, groupItems[0].kleurkode);
            const hasAxaltaMapping = axaltaColor.kleurkode !== groupItems[0].kleurkode;

            return (
              <div key={kleurGroepLabel}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                    <span
                      className="inline-block size-3 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: colorHex }}
                      aria-hidden="true"
                    />
                    {kleurGroepLabel}{hasAxaltaMapping ? " " : null}
                    {hasAxaltaMapping && (
                      <span className="text-[12px] font-normal text-muted-foreground">
                        ({axaltaColor.kleursoort} · {axaltaColor.kleurkode})
                      </span>
                    )}
                  </h2>
                  <span className="text-[12px] text-[#5e5e5e]">
                    {groupItems.length} orderregel{groupItems.length === 1 ? "" : "s"}
                  </span>
                </div>
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={COL_BRON}>Bron</TableHead>
                      <TableHead className={COL_ORDER}>Order</TableHead>
                      <TableHead className={COL_ARTIKEL}>Artikel</TableHead>
                      <TableHead className={COL_OMSCHRIJVING}>Omschrijving</TableHead>
                      <TableHead className={COL_AANTAL}>Aantal</TableHead>
                      <TableHead className={COL_VERPAKKING}>Verpakking</TableHead>
                      <TableHead className={COL_LEVERANCIER}>Leverancier</TableHead>
                      <TableHead className={COL_STATUS}>Status / Bestel-advies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...subgroups.entries()].map(([leverancier, subgroupItems]) => {
                      const isOnbekend = leverancier === "Onbekend";
                      const levnr = isOnbekend ? null : (subgroupItems[0].lakLevnr ?? null);
                      return (
                      <Fragment key={leverancier}>
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={8} className="bg-muted/40">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <span className="text-[13px] font-semibold text-primary">
                                  {isOnbekend ? "Geen leverancier" : leverancier}
                                </span>
                                <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                                  ({subgroupItems.length} orderregel
                                  {subgroupItems.length === 1 ? "" : "s"})
                                </span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                                disabled={isOnbekend || !levnr}
                                onClick={() =>
                                  setBestellingGroep({
                                    id: `${kleurGroepLabel}|${leverancier}|${Date.now()}`,
                                    leverancier,
                                    levnr,
                                    items: subgroupItems,
                                  })
                                }
                              >
                                Bestelling aanmaken
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {subgroupItems.map((item, i) => {
                          const isMinMax = item.bron === "min-max-voorraad";
                          return (
                            <Fragment key={`${item.bron}-${item.bonnr ?? "x"}-${item.artnr}-${i}`}>
                              <TableRow
                                className="cursor-pointer [&>td]:pb-0.5"
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedItem(item)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedItem(item);
                                  }
                                }}
                              >
                                <TableCell>
                                  <BronBadge bron={item.bron} />
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {isMinMax ? "STOCK" : item.bonnr}
                                </TableCell>
                                <TableCell>{item.artnr}</TableCell>
                                <TableCell className={`${COL_OMSCHRIJVING} whitespace-normal`}>
                                  {item.omschrijving}
                                </TableCell>
                                <TableCell
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <Input
                                    type="number"
                                    aria-label={`Aantal voor ${item.artnr}`}
                                    className="h-7 w-full px-1.5 text-[13px]"
                                    // Bij min-max-voorraad is er geen echte "aantal" (geen
                                    // order/productielijn) - het bestel-advies is dan het
                                    // startpunt, maar blijft net als overal hier enkel een
                                    // lokale front-end-waarde tot er effectief een order naar
                                    // de leverancier wordt aangemaakt.
                                    value={item.aantal ?? (isMinMax ? item.bestelAdvies : null) ?? ""}
                                    onChange={(e) =>
                                      setOverride(item, {
                                        aantal:
                                          e.target.value === "" ? undefined : Number(e.target.value),
                                      })
                                    }
                                  />
                                </TableCell>
                                <TableCell className={COL_VERPAKKING}>
                                  {formatQty(item.verpakking)}
                                </TableCell>
                                <TableCell
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <Select
                                    value={item.lakNaam || undefined}
                                    onValueChange={(value) =>
                                      setOverride(item, { lakNaam: value ?? undefined })
                                    }
                                  >
                                    <SelectTrigger
                                      aria-label={`Leverancier voor ${item.artnr}`}
                                      size="sm"
                                      className="w-full"
                                    >
                                      <SelectValue placeholder="-" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {leveranciers.map((leverancier) => (
                                        <SelectItem key={leverancier} value={leverancier}>
                                          {leverancier}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  {isMinMax ? (
                                    <span className="text-[12px] text-foreground">
                                      Bestel-advies:{" "}
                                      {item.bestelAdvies !== null
                                        ? formatQty(item.bestelAdvies)
                                        : DASH}
                                    </span>
                                  ) : item.status ? (
                                    <StatusBadge status={item.status} />
                                  ) : (
                                    DASH
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow className="hover:bg-transparent [&>td]:pt-0">
                                <TableCell colSpan={8} className="text-[11px] text-muted-foreground">
                                  Voorraad {formatQty(item.voorraad)} · Gereserveerd{" "}
                                  {formatQty(item.gereserveerdVoorraad)} · Ext. voorraad{" "}
                                  {formatQty(item.extVoorraad)} · Ext. gereserveerd{" "}
                                  {formatQty(item.extGereserveerd)}
                                  {"  ·  "}
                                  Verkoop 1/3/6/9/12m: {formatQty(item.verkoop1Maand)} /{" "}
                                  {formatQty(item.verkoop3Maand)} / {formatQty(item.verkoop6Maand)} /{" "}
                                  {formatQty(item.verkoop9Maand)} / {formatQty(item.verkoop12Maand)}
                                </TableCell>
                              </TableRow>
                            </Fragment>
                          );
                        })}
                      </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      )}

      <LakproductieDetailDialog
        item={selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      />

      <BestellingPreviewDialog
        key={bestellingGroep?.id ?? "closed"}
        leverancier={bestellingGroep?.leverancier ?? ""}
        levnr={bestellingGroep?.levnr ?? null}
        items={bestellingGroep?.items ?? null}
        onOpenChange={(open) => {
          if (!open) setBestellingGroep(null);
        }}
      />
    </div>
  );
}
