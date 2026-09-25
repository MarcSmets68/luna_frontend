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
import { Textarea } from "@/components/ui/textarea";
import { KwaliteitscontroleErrorState } from "./kwaliteitscontrole-error-state";

/**
 * Mandatory free-text opmerking before an afkeuring is submitted - mirrors
 * stockbeweging-confirm-dialog.tsx's dialog pattern (error stays inline in
 * the dialog on failure, dialog does not close so the operator doesn't
 * lose their typed opmerking).
 */
export function AfkeurDialog({
  open,
  submitting,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onConfirm: (opmerking: string) => void;
  onCancel: () => void;
}) {
  const [opmerking, setOpmerking] = useState("");

  // Clear the field whenever the dialog transitions from closed to open
  // (e.g. re-opened for a new/different session) - adjusted during render
  // per React's "you might not need an effect" guidance, not in a
  // useEffect (avoids the cascading-render lint rule for setState-in-effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOpmerking("");
  }

  const trimmed = opmerking.trim();
  const isValid = trimmed.length > 0;

  function handleConfirm() {
    if (!isValid) return;
    onConfirm(trimmed);
  }

  function handleCancel() {
    setOpmerking("");
    onCancel();
  }

  function handleOpenChange(next: boolean) {
    if (!next) handleCancel();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Controle afkeuren</DialogTitle>
          <DialogDescription>
            Geef aan waarom deze controle wordt afgekeurd.
          </DialogDescription>
        </DialogHeader>

        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Opmerking
          <Textarea
            value={opmerking}
            onChange={(e) => setOpmerking(e.target.value)}
            aria-label="Opmerking"
            rows={4}
            className="text-base"
          />
        </label>

        {error && <KwaliteitscontroleErrorState message={error} />}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
            Annuleren
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={submitting || !isValid}>
            {submitting ? "Bezig..." : "Bevestigen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
