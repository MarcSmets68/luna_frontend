"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteLeverancier } from "@/lib/api-client";

export function DeleteLeverancierDialog({
  levnr,
  naam,
  open,
  onOpenChange,
  onDeleted,
}: {
  levnr: number;
  naam: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await deleteLeverancier(levnr);
      onOpenChange(false);
      onDeleted();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het verwijderen van de leverancier."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leverancier verwijderen</DialogTitle>
          <DialogDescription>
            Leverancier {naam} ({levnr}) verwijderen? Dit kan niet ongedaan worden gemaakt.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleting}
          >
            Annuleren
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? "Bezig..." : "Verwijderen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
