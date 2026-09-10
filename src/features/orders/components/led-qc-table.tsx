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
import { deleteBonLedQc, getBonLedQc, type BonLedQcItem } from "@/lib/api-client";
import { LedQcForm } from "./led-qc-form";

/** QC-registraties (bon_led_qc) for a bon, listed below the LED-configuratie table. */
export function LedQcTable({ bonnr }: { bonnr: number }) {
  const [items, setItems] = useState<BonLedQcItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<BonLedQcItem | "new" | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBonLedQc(bonnr)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Er ging iets mis bij het laden van de QC-registraties."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bonnr]);

  function keyOf(item: BonLedQcItem) {
    return `${item.groepnr}-${item.volgnr}-${item.lijnnr}`;
  }

  async function handleDelete(item: BonLedQcItem) {
    if (!window.confirm(`QC-registratie ${item.volgnr} verwijderen?`)) return;
    setDeletingKey(keyOf(item));
    setDeleteError(null);
    try {
      await deleteBonLedQc(bonnr, item.groepnr, item.volgnr, item.lijnnr);
      setItems((prev) => (prev ?? []).filter((row) => keyOf(row) !== keyOf(item)));
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Er ging iets mis bij het verwijderen van de QC-registratie."
      );
    } finally {
      setDeletingKey(null);
    }
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  if (items === null) {
    return <p className="text-sm text-muted-foreground">QC-registraties laden...</p>;
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-foreground">QC-registraties</h2>
        <Button type="button" size="sm" variant="outline" onClick={() => setFormTarget("new")}>
          <Plus />
          QC-registratie toevoegen
        </Button>
      </div>

      {deleteError && <p className="mb-2 text-sm text-destructive">{deleteError}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen QC-registraties.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Volgnr</TableHead>
              <TableHead>Groepnr</TableHead>
              <TableHead>Lijnnr</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Controle</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={keyOf(row)} className="cursor-pointer" onClick={() => setFormTarget(row)}>
                <TableCell className="font-semibold">{row.volgnr}</TableCell>
                <TableCell>{row.groepnr}</TableCell>
                <TableCell>{row.lijnnr}</TableCell>
                <TableCell>{formatDatum(row.datum)}</TableCell>
                <TableCell className="whitespace-normal">{row.omschr}</TableCell>
                <TableCell>{row.controle ? "Ja" : "Nee"}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Verwijder QC-registratie ${row.volgnr}`}
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
        <LedQcForm
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
