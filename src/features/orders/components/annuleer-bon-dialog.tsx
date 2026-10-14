"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { annuleerBon, ApiError, type BonItem } from "@/lib/api-client";
import { annuleerBlokkade, kanAnnuleren } from "../lib/bon-stempel";

type AnnuleerBonDialogProps = {
  bonnr: number;
  klantNaam: string;
  stempel: string;
  disabled?: boolean;
  describedById?: string;
  onCancelled: (bon: BonItem) => void;
  onConflict?: () => void;
};

type Fout = { message: string; detail?: string };

const GENERIEKE_FOUT = "Er ging iets mis bij het annuleren van de order.";

function mapAnnuleerFout(e: unknown): Fout {
  if (e instanceof ApiError) {
    if (e.status === 409) {
      return {
        message: "De status van deze order is intussen gewijzigd; ververs de pagina.",
        detail: e.backendMessage,
      };
    }
    if (e.status === 404) {
      return { message: "Order niet gevonden.", detail: e.backendMessage };
    }
    return { message: GENERIEKE_FOUT, detail: e.backendMessage };
  }
  if (e instanceof Error) {
    return { message: GENERIEKE_FOUT, detail: e.message };
  }
  return { message: GENERIEKE_FOUT };
}

export function AnnuleerBonDialog({
  bonnr,
  klantNaam,
  stempel,
  disabled,
  describedById,
  onCancelled,
  onConflict,
}: AnnuleerBonDialogProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fout, setFout] = useState<Fout | null>(null);

  function handleOpenChange(next: boolean) {
    if (busy && !next) return;
    if (!next) setFout(null);
    setOpen(next);
  }

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    setFout(null);
    try {
      const updated = await annuleerBon(bonnr);
      setOpen(false);
      onCancelled(updated);
    } catch (e) {
      setFout(mapAnnuleerFout(e));
      if (e instanceof ApiError && e.status === 409) onConflict?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || busy || !kanAnnuleren(stempel)}
        title={annuleerBlokkade(stempel) ?? undefined}
        aria-describedby={describedById}
        onClick={() => setOpen(true)}
      >
        Annuleer order
      </Button>
      <Dialog open={open} onOpenChange={(next) => handleOpenChange(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order annuleren</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze order wil annuleren? Dit kan niet ongedaan gemaakt
              worden via de applicatie.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium">
            Bon {bonnr} — {klantNaam}
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>De stempel gaat terug naar Open.</li>
            <li>
              Netto-, Recupel-, totaal- en A-bedrag worden gewist. De btw blijft behouden.
            </li>
            <li>
              Alle stockreservaties worden vrijgegeven, inclusief geparkeerde lijnen en
              BOM-componenten.
            </li>
            <li>Het besteld-saldo van de klant wordt verlaagd.</li>
          </ul>
          {fout && (
            <div>
              <p role="alert" className="text-sm text-destructive">
                {fout.message}
              </p>
              {fout.detail && (
                <p className="text-xs text-muted-foreground">{fout.detail}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
              Terug
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !kanAnnuleren(stempel)}
              onClick={handleConfirm}
            >
              {busy ? "Bezig..." : "Order annuleren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
