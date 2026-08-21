"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteOfflijn, reorderOfflijn, type OfflijnItem } from "@/lib/api-client";
import { formatBedrag } from "@/lib/format";
import { OfflijnFormDialog } from "./offlijn-form-dialog";

/**
 * Editable table of offlijn rows for `OfferteEditPage`. Lines are always
 * rendered ordered by lijnnr (the order the backend already returns them
 * in - see GET .../lijn). Every mutation (create/update/delete/reorder)
 * updates local `lines` state directly from that mutation's response
 * rather than refetching the whole page (per the Fase 1 design).
 */
export function OfferteLijnenEditor({
  offnr,
  versie,
  lines,
  onLinesChange,
}: {
  offnr: number;
  versie: number;
  lines: OfflijnItem[];
  onLinesChange: (lines: OfflijnItem[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<OfflijnItem | null>(null);
  // Bumped on every open so `OfflijnFormDialog` always remounts with fresh
  // form state - two consecutive "+ Lijn toevoegen" clicks are otherwise
  // indistinguishable (both have editingLine === null).
  const [dialogSession, setDialogSession] = useState(0);
  const [pendingAction, setPendingAction] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...lines].sort((a, b) => a.lijnnr - b.lijnnr);

  function openCreateDialog() {
    setEditingLine(null);
    setDialogSession((n) => n + 1);
    setDialogOpen(true);
  }

  function openEditDialog(line: OfflijnItem) {
    setEditingLine(line);
    setDialogSession((n) => n + 1);
    setDialogOpen(true);
  }

  function handleSaved(line: OfflijnItem) {
    const exists = lines.some((l) => l.lijnnr === line.lijnnr);
    onLinesChange(
      exists ? lines.map((l) => (l.lijnnr === line.lijnnr ? line : l)) : [...lines, line]
    );
  }

  async function handleDelete(line: OfflijnItem) {
    setPendingAction(line.lijnnr);
    setError(null);
    try {
      await deleteOfflijn(offnr, versie, line.lijnnr);
      onLinesChange(lines.filter((l) => l.lijnnr !== line.lijnnr));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het verwijderen van de lijn.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReorder(line: OfflijnItem, direction: "up" | "down") {
    setPendingAction(line.lijnnr);
    setError(null);
    try {
      const result = await reorderOfflijn(offnr, versie, line.lijnnr, direction);
      onLinesChange(result.items);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het herschikken van de lijnen."
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-foreground">Lijnen</h2>
        <Button type="button" size="sm" onClick={openCreateDialog}>
          + Lijn toevoegen
        </Button>
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen lijnen op deze offerte.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Groep</TableHead>
              <TableHead>Lijnnr</TableHead>
              <TableHead>Artnr</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Aantal</TableHead>
              <TableHead>Prijs</TableHead>
              <TableHead>Korting</TableHead>
              <TableHead>Bedrag</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((line, index) => {
              const isFirst = index === 0;
              const isLast = index === sorted.length - 1;
              const busy = pendingAction === line.lijnnr;

              const actions = (
                <TableCell className="text-right whitespace-nowrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Lijn ${line.lijnnr} omhoog`}
                    disabled={isFirst || busy}
                    onClick={() => handleReorder(line, "up")}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Lijn ${line.lijnnr} omlaag`}
                    disabled={isLast || busy}
                    onClick={() => handleReorder(line, "down")}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Lijn ${line.lijnnr} bewerken`}
                    disabled={busy}
                    onClick={() => openEditDialog(line)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Lijn ${line.lijnnr} verwijderen`}
                    disabled={busy}
                    onClick={() => handleDelete(line)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              );

              if (line.kolomtitel) {
                return (
                  <TableRow key={line.lijnnr}>
                    <TableCell className="text-xs text-muted-foreground">
                      {line.groepnr}
                    </TableCell>
                    <TableCell className="font-semibold">{line.lijnnr}</TableCell>
                    <TableCell colSpan={6} className="font-bold whitespace-normal">
                      {line.omschrijvingOfferte}
                    </TableCell>
                    {actions}
                  </TableRow>
                );
              }

              if (line.infolijn) {
                return (
                  <TableRow key={line.lijnnr}>
                    <TableCell className="text-xs text-muted-foreground">
                      {line.groepnr}
                    </TableCell>
                    <TableCell className="font-semibold">{line.lijnnr}</TableCell>
                    <TableCell colSpan={6} className="italic whitespace-normal">
                      {line.omschrijvingOfferte}
                    </TableCell>
                    {actions}
                  </TableRow>
                );
              }

              if (line.subtotaal) {
                return (
                  <TableRow key={line.lijnnr} className="bg-muted/50 font-semibold">
                    <TableCell className="text-xs text-muted-foreground">
                      {line.groepnr}
                    </TableCell>
                    <TableCell>{line.lijnnr}</TableCell>
                    <TableCell colSpan={5} className="whitespace-normal">
                      {line.omschrijvingOfferte}
                    </TableCell>
                    <TableCell>{formatBedrag(line.bedrag)}</TableCell>
                    {actions}
                  </TableRow>
                );
              }

              return (
                <TableRow key={line.lijnnr}>
                  <TableCell className="text-xs text-muted-foreground">{line.groepnr}</TableCell>
                  <TableCell className="font-semibold">{line.lijnnr}</TableCell>
                  <TableCell>{line.artnr}</TableCell>
                  <TableCell className="whitespace-normal">
                    {line.omschrijvingOfferte || line.omschrijving}
                  </TableCell>
                  <TableCell>{line.aantal}</TableCell>
                  <TableCell>{formatBedrag(line.verkoopprijs)}</TableCell>
                  <TableCell>{line.korting}</TableCell>
                  <TableCell>{formatBedrag(line.bedrag)}</TableCell>
                  {actions}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <OfflijnFormDialog
        key={dialogSession}
        offnr={offnr}
        versie={versie}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingLine={editingLine}
        lines={lines}
        onSaved={handleSaved}
      />
    </div>
  );
}
