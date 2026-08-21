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
import { annuleerBon } from "@/lib/api-client";

/**
 * Annuleer-actie voor een bon: enkel bruikbaar wanneer de order in stempel
 * "V" of "B" staat. De backend (BonBE.AnnuleerBon) accepteert uitsluitend
 * deze twee waarden en geeft 409 voor elke andere stempel (inclusief "O"
 * en lege/onbekende waarden), dus we voorkomen de aanroep al client-side
 * door de knop enkel klikbaar te tonen voor deze twee stempels.
 */
export function AnnuleerBonDialog({ bonnr, stempel }: { bonnr: number; stempel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kanAnnuleren = stempel === "V" || stempel === "B";

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
    }
    setOpen(nextOpen);
  }

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await annuleerBon(bonnr);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het annuleren van de order.");
    } finally {
      setBusy(false);
    }
  }

  if (!kanAnnuleren) {
    return (
      <Button type="button" variant="outline" disabled title="Order kan niet geannuleerd worden">
        Annuleer order
      </Button>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Annuleer order
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order annuleren</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze order wil annuleren? Dit wist de bedragen en geeft
              reservaties vrij.
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              Annuleren
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm} disabled={busy}>
              {busy ? "Bezig..." : "Bevestigen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
