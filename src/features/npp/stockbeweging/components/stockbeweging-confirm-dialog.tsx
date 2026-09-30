"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MOVEMENT_TYPE_LABELS } from "../types";
import type { ArtikelScanArticle, StockBewegingMovementType } from "../types";
import { StockbewegingErrorState } from "./stockbeweging-error-state";

/**
 * Mandatory confirmation summary - the only path that actually triggers
 * postStockBeweging (via onConfirm). Not skippable: there is no other way
 * to book a movement in this feature. On error, this dialog stays open
 * (see StockbewegingView) so the error renders here, near the summary,
 * without losing the resolved article/form input.
 */
export function StockbewegingConfirmDialog({
  open,
  article,
  movementType,
  aantal,
  opm,
  nieuwMagazijn,
  submitting,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  article: ArtikelScanArticle;
  movementType: StockBewegingMovementType;
  aantal: string;
  opm: string;
  nieuwMagazijn: string;
  submitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isTransferIntern = movementType === "transfer_intern";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Boeking bevestigen</DialogTitle>
          <DialogDescription>Controleer de gegevens voor u de boeking bevestigt.</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Artikel</dt>
          <dd className="text-foreground">{article.artnr}</dd>
          <dt className="text-muted-foreground">Omschrijving</dt>
          <dd className="text-foreground">{article.omschrijving}</dd>
          <dt className="text-muted-foreground">Type beweging</dt>
          <dd className="text-foreground">{MOVEMENT_TYPE_LABELS[movementType]}</dd>
          {isTransferIntern ? (
            <>
              <dt className="text-muted-foreground">Nieuw magazijn</dt>
              <dd className="text-foreground">{nieuwMagazijn}</dd>
            </>
          ) : (
            <>
              <dt className="text-muted-foreground">Aantal</dt>
              <dd className="text-foreground">{aantal}</dd>
              <dt className="text-muted-foreground">Opmerking</dt>
              <dd className="text-foreground">{opm}</dd>
            </>
          )}
        </dl>

        {error && <StockbewegingErrorState message={error} />}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Annuleren
          </Button>
          <Button type="button" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Bezig..." : "Bevestigen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
