"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createLakproductieBestelling,
  type CreateBestellingLine,
  type LakproductieItem,
} from "@/lib/api-client";

type BestellingLijnState = {
  key: string;
  item: LakproductieItem;
  included: boolean;
  aantal: number;
};

// Voorgesteld aantal = openstaand saldo (wat nog niet besteld is), nooit
// negatief - bevestigd met Marc: dit is enkel een voorstel, de gebruiker
// kan het aantal in de preview nog vrij aanpassen.
function outstandingAantal(item: LakproductieItem): number {
  // item.aantal krijgt voorrang zodat een lokale Aantal-override op de
  // Lakproduktie-pagina (zie applyOverride() in lakproductie-page.tsx, die
  // ook voor min-max-voorraad-regels altijd naar item.aantal schrijft)
  // hier meegenomen wordt - bestelAdvies is enkel de fallback voor
  // min-max-voorraad-regels zonder override (item.aantal is dan null).
  const basis = item.aantal ?? item.bestelAdvies;
  const besteld = item.lijnBesteld ?? 0;
  const remaining = (basis ?? 0) - besteld;
  return remaining > 0 ? remaining : 0;
}

function lineKey(item: LakproductieItem, index: number): string {
  return [item.bron, item.bonnr ?? "", item.lijnnr ?? "", item.prodLijnnr ?? "", item.artnr, index].join(
    "|"
  );
}

// Bouwt de klantorder-link mee in de payload zodat de backend de
// bijhorende bonlijn/bonlijn_productie.besteld kan ophogen - zie
// Luna.BusinessLogic.LakproductieBE voor hoe lijnnr/prodLijnnr per bron
// gevuld worden (bron "lopende-orders": lijnnr = bonlijn.lijnnr; bron
// "lopende-productielijnen": lijnnr = parent bonlijn.lijnnr, prodLijnnr =
// bonlijn_productie.lijnnr). "min-max-voorraad" heeft geen klantlink.
function lineToPayload(item: LakproductieItem, aantal: number): CreateBestellingLine {
  const payload: CreateBestellingLine = {
    artnr: item.artnr,
    omschrijving: item.omschrijving,
    aantal,
  };

  if (item.bron === "lopende-orders" && item.bonnr !== null && item.lijnnr !== null) {
    payload.bonnr = item.bonnr;
    payload.blijnnr = item.lijnnr;
  } else if (
    item.bron === "lopende-productielijnen" &&
    item.bonnr !== null &&
    item.lijnnr !== null &&
    item.prodLijnnr !== null
  ) {
    payload.bonnr = item.bonnr;
    payload.blijnnr = item.lijnnr;
    payload.volgnr = item.prodLijnnr;
  }

  return payload;
}

/**
 * Preview van de bestelling die aangemaakt zou worden voor één
 * leverancier-subgroep binnen een kleurgroep op de Lakproduktie-pagina.
 * Volledig bewerkbaar (lijnen uitvinken, aantal per lijn aanpassen) -
 * niets wordt naar de backend geschreven tot "Bestelling aanmaken" wordt
 * bevestigd; "Annuleren" of de dialog sluiten doet geen enkele API-call.
 */
export function BestellingPreviewDialog({
  leverancier,
  levnr,
  items,
  onOpenChange,
}: {
  leverancier: string;
  levnr: number | null;
  items: LakproductieItem[] | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  // Lazy init only - the parent remounts this component (via a `key` tied
  // to each "Bestelling aanmaken" click) whenever a new leverancier-groep
  // is opened, so this never needs to react to `items` changing on an
  // already-mounted instance.
  const [lines, setLines] = useState<BestellingLijnState[]>(() =>
    (items ?? []).map((item, index) => ({
      key: lineKey(item, index),
      item,
      included: true,
      aantal: outstandingAantal(item),
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrdnr, setCreatedOrdnr] = useState<number | null>(null);

  const open = items !== null;

  const toggleIncluded = (key: string) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, included: !line.included } : line)));

  const setAantal = (key: string, aantal: number) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, aantal } : line)));

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (levnr === null) return;

    const selected = lines.filter((line) => line.included && line.aantal > 0);
    if (selected.length === 0) {
      setError("Selecteer minstens 1 lijn met een aantal groter dan 0.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await createLakproductieBestelling({
        levnr,
        lines: selected.map((line) => lineToPayload(line.item, line.aantal)),
      });
      setCreatedOrdnr(result.ordnr);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het aanmaken van de bestelling."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bestelling aanmaken — {leverancier}</DialogTitle>
          <DialogDescription>
            Controleer de lijnen en aantallen. Er wordt pas een bestelling aangemaakt na
            bevestigen.
          </DialogDescription>
        </DialogHeader>

        {createdOrdnr !== null ? (
          <div className="py-4 text-sm text-foreground">
            Bestelling <strong>#{createdOrdnr}</strong> is aangemaakt bij {leverancier}.
          </div>
        ) : (
          <>
            <div className="max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Artikel</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead>Voor</TableHead>
                    <TableHead className="w-24">Aantal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.key}>
                      <TableCell>
                        <Checkbox
                          checked={line.included}
                          onCheckedChange={() => toggleIncluded(line.key)}
                          aria-label={`Lijn opnemen voor ${line.item.artnr}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{line.item.artnr}</TableCell>
                      <TableCell className="whitespace-normal text-[13px]">
                        {line.item.omschrijving}
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">
                        {line.item.bron === "min-max-voorraad"
                          ? "Voorraad"
                          : `${line.item.klant ?? "\u2014"} (${line.item.bonnr})`}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          aria-label={`Aantal voor ${line.item.artnr}`}
                          className="h-7 w-full px-1.5 text-[13px]"
                          disabled={!line.included}
                          value={line.aantal}
                          onChange={(e) => setAantal(line.key, Number(e.target.value))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </>
        )}

        <DialogFooter>
          {createdOrdnr !== null ? (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Sluiten
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuleren
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={submitting}>
                {submitting ? "Bezig..." : "Bestelling aanmaken"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
