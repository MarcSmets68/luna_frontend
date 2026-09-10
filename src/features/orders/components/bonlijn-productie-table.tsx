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
import {
  deleteBonLijnProductie,
  getBonLijnProductie,
  type BonLijnProductieItem,
} from "@/lib/api-client";
import { BonlijnProductieRowForm } from "./bonlijn-productie-row-form";

/**
 * Productie-sublijnen for a single bonlijn - lazily loaded when the
 * parent row is expanded. Server state (the sublijnen list) is kept in
 * local state here since this component owns its own fetch/refresh cycle,
 * separate from the (dialog open/edit target) local UI state below.
 */
export function BonlijnProductieTable({ bonnr, blijnnr }: { bonnr: number; blijnnr: number }) {
  const [items, setItems] = useState<BonLijnProductieItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<BonLijnProductieItem | "new" | null>(null);
  const [deletingLijnnr, setDeletingLijnnr] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBonLijnProductie(bonnr, blijnnr)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Er ging iets mis bij het laden van de productielijnen."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bonnr, blijnnr]);

  async function handleDelete(item: BonLijnProductieItem) {
    if (!window.confirm(`Productielijn ${item.lijnnr} verwijderen?`)) return;
    setDeletingLijnnr(item.lijnnr);
    setDeleteError(null);
    try {
      await deleteBonLijnProductie(bonnr, blijnnr, item.lijnnr);
      setItems((prev) => (prev ?? []).filter((row) => row.lijnnr !== item.lijnnr));
    } catch (e) {
      // 409 (besteld <> 0) or any other server error - show verbatim, no
      // client-side prediction of that rule.
      setDeleteError(
        e instanceof Error ? e.message : "Er ging iets mis bij het verwijderen van de productielijn."
      );
    } finally {
      setDeletingLijnnr(null);
    }
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  if (items === null) {
    return <p className="text-sm text-muted-foreground">Productielijnen laden...</p>;
  }

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground">Productie-sublijnen</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => setFormTarget("new")}>
          <Plus />
          Sublijn toevoegen
        </Button>
      </div>

      {deleteError && <p className="mb-2 text-sm text-destructive">{deleteError}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen productie-sublijnen.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lijnnr</TableHead>
              <TableHead>Artnr</TableHead>
              <TableHead>Omschr</TableHead>
              <TableHead>Aantal</TableHead>
              <TableHead>Gereserv</TableHead>
              <TableHead>Eff. gereserv</TableHead>
              <TableHead>Besteld</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow
                key={row.lijnnr}
                className="cursor-pointer"
                onClick={() => setFormTarget(row)}
              >
                <TableCell className="font-semibold">{row.lijnnr}</TableCell>
                <TableCell>{row.artnr}</TableCell>
                <TableCell className="whitespace-normal">{row.omschr}</TableCell>
                <TableCell>{row.aantal}</TableCell>
                <TableCell>{row.gereserv}</TableCell>
                <TableCell>{row.effectiefGereserv}</TableCell>
                <TableCell>{row.besteld}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Verwijder productielijn ${row.lijnnr}`}
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
        <BonlijnProductieRowForm
          bonnr={bonnr}
          blijnnr={blijnnr}
          item={formTarget === "new" ? undefined : formTarget}
          open={formTarget !== null}
          onOpenChange={(open) => {
            if (!open) setFormTarget(null);
          }}
          onSaved={(saved) => {
            setItems((prev) => {
              const rows = prev ?? [];
              const exists = rows.some((row) => row.lijnnr === saved.lijnnr);
              return exists
                ? rows.map((row) => (row.lijnnr === saved.lijnnr ? saved : row))
                : [...rows, saved];
            });
            setFormTarget(null);
          }}
        />
      )}
    </div>
  );
}
