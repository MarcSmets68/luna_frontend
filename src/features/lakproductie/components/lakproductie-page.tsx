import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LakproductieItem } from "@/lib/api-client";
import { getColorHex } from "../colorMap";
import { mapToAxaltaColor } from "../colorMapping";
import { PrintButton } from "./print-button";

function formatQty(value: number): string {
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

// Subgroup within a kleur/techniek/afwerking group: the distinct raw
// behandeling specs (artikel.led-coating) that all resolved to that same
// combination - kept visible because they can still be physically
// different coating instructions even when the derived kleur/techniek/
// afwerking match.
function groupByBehandeling(items: LakproductieItem[]): Map<string, LakproductieItem[]> {
  return groupBy(items, (item) => item.behandeling);
}

export function LakproductiePage({ items }: { items: LakproductieItem[] }) {
  const groups = groupByKleurTechniekAfwerking(items);

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Productie
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Lakproduktie</h1>
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-[#5e5e5e]">{items.length} orderregels</div>
          <PrintButton />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Geen artikelen gevonden die nog gelakt of geanodiseerd moeten worden.
        </p>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([kleurGroepLabel, groupItems]) => {
            const subgroups = groupByBehandeling(groupItems);
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Klant</TableHead>
                      <TableHead>Artikel</TableHead>
                      <TableHead>Omschrijving</TableHead>
                      <TableHead>Aantal</TableHead>
                      <TableHead>Leverancier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...subgroups.entries()].map(([behandeling, subgroupItems]) => (
                      <Fragment key={behandeling}>
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={6}
                            className="bg-muted/40 text-[12px] font-medium text-muted-foreground"
                          >
                            {behandeling}
                            <span className="ml-2 font-normal">
                              ({subgroupItems.length} orderregel
                              {subgroupItems.length === 1 ? "" : "s"})
                            </span>
                          </TableCell>
                        </TableRow>
                        {subgroupItems.map((item, i) => (
                          <Fragment key={`${item.bonnr}-${item.artnr}-${i}`}>
                            <TableRow className="[&>td]:pb-0.5">
                              <TableCell className="font-semibold">{item.bonnr}</TableCell>
                              <TableCell>{item.klant}</TableCell>
                              <TableCell>{item.artnr}</TableCell>
                              <TableCell className="whitespace-normal">
                                {item.omschrijving}
                              </TableCell>
                              <TableCell>{item.aantal}</TableCell>
                              <TableCell>{item.lakNaam || "-"}</TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-transparent [&>td]:pt-0">
                              <TableCell colSpan={6} className="text-[11px] text-muted-foreground">
                                Voorraad {formatQty(item.voorraad)} · Gereserveerd{" "}
                                {formatQty(item.gereserveerd)} · Ext. voorraad{" "}
                                {formatQty(item.extVoorraad)} · Ext. gereserveerd{" "}
                                {formatQty(item.extGereserveerd)}
                                {"  ·  "}
                                Verkoop 1/3/6/9/12m: {formatQty(item.verkoop1Maand)} /{" "}
                                {formatQty(item.verkoop3Maand)} / {formatQty(item.verkoop6Maand)} /{" "}
                                {formatQty(item.verkoop9Maand)} / {formatQty(item.verkoop12Maand)}
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
