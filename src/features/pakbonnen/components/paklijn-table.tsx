"use client";

import { useState } from "react";
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
import { formatBedrag } from "@/lib/format";
import { deletePaklijn, type PaklijnItem } from "@/lib/api-client";
import { PaklijnRowForm } from "./paklijn-row-form";

/** Paklijn (packing slip lines) table for a pakbon, with CRUD actions. */
export function PaklijnTable({
  paknr,
  items,
  onItemsChange,
}: {
  paknr: number;
  items: PaklijnItem[];
  onItemsChange: (items: PaklijnItem[]) => void;
}) {
  const [formTarget, setFormTarget] = useState<PaklijnItem | "new" | null>(null);
  const [deletingLijnnr, setDeletingLijnnr] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(item: PaklijnItem) {
    if (!window.confirm(`Paklijn ${item.lijnnr} verwijderen?`)) return;
    setDeletingLijnnr(item.lijnnr);
    setDeleteError(null);
    try {
      await deletePaklijn(paknr, item.lijnnr);
      onItemsChange(items.filter((row) => row.lijnnr !== item.lijnnr));
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Er ging iets mis bij het verwijderen van de paklijn."
      );
    } finally {
      setDeletingLijnnr(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-foreground">Paklijnen</h2>
        <Button type="button" size="sm" onClick={() => setFormTarget("new")}>
          <Plus />
          Paklijn toevoegen
        </Button>
      </div>

      {deleteError && <p className="mb-2 text-sm text-destructive">{deleteError}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen paklijnen gevonden voor deze pakbon.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lijnnr</TableHead>
              <TableHead>Artnr</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Aantal</TableHead>
              <TableHead>Te leveren</TableHead>
              <TableHead>Afgehaald</TableHead>
              <TableHead>Bedrag</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.lijnnr} className="cursor-pointer" onClick={() => setFormTarget(row)}>
                <TableCell className="font-semibold">{row.lijnnr}</TableCell>
                <TableCell>{row.artnr}</TableCell>
                <TableCell className="whitespace-normal">{row.omschr}</TableCell>
                <TableCell>{row.aantal}</TableCell>
                <TableCell>{row.teLeveren}</TableCell>
                <TableCell>{row.afgehaald}</TableCell>
                <TableCell>{formatBedrag(row.bedrag)}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Verwijder paklijn ${row.lijnnr}`}
                    disabled={deletingLijnnr === row.lijnnr}
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
        <PaklijnRowForm
          paknr={paknr}
          item={formTarget === "new" ? undefined : formTarget}
          open={formTarget !== null}
          onOpenChange={(open) => {
            if (!open) setFormTarget(null);
          }}
          onSaved={(saved) => {
            const exists = items.some((row) => row.lijnnr === saved.lijnnr);
            onItemsChange(
              exists
                ? items.map((row) => (row.lijnnr === saved.lijnnr ? saved : row))
                : [...items, saved]
            );
            setFormTarget(null);
          }}
        />
      )}
    </div>
  );
}
