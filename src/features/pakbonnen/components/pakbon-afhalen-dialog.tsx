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
import { Input } from "@/components/ui/input";
import { afhalenPakbon, type PakbonItem } from "@/lib/api-client";

/** Dialog to mark a pakbon as afgehaald (picked up), capturing the identification used. */
export function PakbonAfhalenDialog({
  paknr,
  open,
  onOpenChange,
  onAfgehaald,
}: {
  paknr: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAfgehaald: (updated: PakbonItem) => void;
}) {
  const [afgehaaldId, setAfgehaaldId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      setAfgehaaldId("");
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!afgehaaldId.trim()) {
      setError("Vul een identificatie in.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await afhalenPakbon(paknr, afgehaaldId.trim());
      onAfgehaald(updated);
      handleOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het afhandelen van de afhaling."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pakbon afhalen</DialogTitle>
          <DialogDescription>
            Pakbon {paknr} als afgehaald markeren. Vul de identificatie in van de persoon die de
            goederen afhaalt.
          </DialogDescription>
        </DialogHeader>

        <label className="flex flex-col gap-1 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Identificatie
          <Input
            value={afgehaaldId}
            onChange={(e) => setAfgehaaldId(e.target.value)}
            className="mt-1 font-normal normal-case"
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Annuleren
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={saving}>
            {saving ? "Bezig..." : "Afhalen bevestigen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
