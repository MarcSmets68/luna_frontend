"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDatum } from "@/lib/format";
import { deleteBonLedLijn, getBonLedLijnen, type BonLedItem } from "@/lib/api-client";
import { LedConfigForm } from "./led-config-form";

/**
 * LED-configuratielijnen (bon_led) for a bon - server state lives here in
 * local state, refreshed from create/update/delete responses instead of a
 * full re-fetch.
 */
export function LedConfigTable({ bonnr }: { bonnr: number }) {
  const [items, setItems] = useState<BonLedItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<BonLedItem | "new" | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBonLedLijnen(bonnr)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Er ging iets mis bij het laden van de LED-configuratie."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bonnr]);

  function keyOf(item: BonLedItem) {
    return `${item.groepnr}-${item.ledLijn}-${item.lijnnr}`;
  }

  async function handleDelete(item: BonLedItem) {
    if (!window.confirm(`LED-lijn ${item.lijnnr} verwijderen?`)) return;
    setDeletingKey(keyOf(item));
    setDeleteError(null);
    try {
      // 409 if the gekoppelde bonlijn heeft stempel "D" - surfaced
      // verbatim, no client-side prediction of that rule.
      await deleteBonLedLijn(bonnr, item.groepnr, item.ledLijn, item.lijnnr);
      setItems((prev) => (prev ?? []).filter((row) => keyOf(row) !== keyOf(item)));
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Er ging iets mis bij het verwijderen van de LED-lijn."
      );
    } finally {
      setDeletingKey(null);
    }
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  if (items === null) {
    return <p className="text-sm text-muted-foreground">LED-configuratie laden...</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-foreground">LED-configuratie</h2>
        <Button type="button" size="sm" onClick={() => setFormTarget("new")}>
          <Plus />
          LED-lijn toevoegen
        </Button>
      </div>

      {deleteError && <p className="mb-2 text-sm text-destructive">{deleteError}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen LED-configuratielijnen.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lijnnr</TableHead>
              <TableHead>Groepnr</TableHead>
              <TableHead>Artnr</TableHead>
              <TableHead>Soort</TableHead>
              <TableHead>Aantal</TableHead>
              <TableHead>Lengte</TableHead>
              <TableHead>Te leveren</TableHead>
              <TableHead>Leverdatum</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={keyOf(row)} className="cursor-pointer" onClick={() => setFormTarget(row)}>
                <TableCell className="font-semibold">{row.lijnnr}</TableCell>
                <TableCell>{row.groepnr}</TableCell>
                <TableCell>{row.artnr}</TableCell>
                <TableCell>{row.soort}</TableCell>
                <TableCell>{row.aantal}</TableCell>
                <TableCell>{row.lengte}</TableCell>
                <TableCell>{row.teLeveren}</TableCell>
                <TableCell>{formatDatum(row.levDatum)}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Verwijder LED-lijn ${row.lijnnr}`}
                    disabled={deletingKey === keyOf(row)}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(row);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {formTarget && (
        <LedConfigForm
          bonnr={bonnr}
          item={formTarget === "new" ? undefined : formTarget}
          open={formTarget !== null}
          onOpenChange={(open) => {
            if (!open) setFormTarget(null);
          }}
          onSaved={(saved) => {
            setItems((prev) => {
              const rows = prev ?? [];
              const exists = rows.some((row) => keyOf(row) === keyOf(saved));
              return exists
                ? rows.map((row) => (keyOf(row) === keyOf(saved) ? saved : row))
                : [...rows, saved];
            });
            setFormTarget(null);
          }}
        />
      )}
    </div>
  );
}
