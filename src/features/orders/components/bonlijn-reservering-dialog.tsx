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
import { reserveerBonLijn, type BonLijnItem } from "@/lib/api-client";

/**
 * Reserveer/vrijgeven-dialog voor een bonlijn. `delta` > 0 reserveert,
 * `delta` < 0 geeft vrij. The `[0, teLeveren - gereserv]` range shown is a
 * client-side UX hint only - the server (POST .../reservering) remains
 * the source of truth for the actual 400 validation error.
 */
export function BonlijnReserveringDialog({
  bonnr,
  lijn,
  open,
  onOpenChange,
  onReserved,
}: {
  bonnr: number;
  lijn: BonLijnItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReserved: (updated: BonLijnItem) => void;
}) {
  const [delta, setDelta] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxDelta = Math.max(0, lijn.teLeveren - lijn.gereserv);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      setDelta("0");
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    const deltaValue = Number(delta);
    if (Number.isNaN(deltaValue) || deltaValue === 0) {
      setError("Vul een geldig getal in, ongelijk aan 0.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await reserveerBonLijn(bonnr, lijn.lijnnr, deltaValue);
      onReserved(updated);
      handleOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het reserveren van de lijn."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reservering aanpassen</DialogTitle>
          <DialogDescription>
            Lijn {lijn.lijnnr} ({lijn.artnr}) - huidig gereserveerd: {lijn.gereserv}. Positief
            getal om te reserveren, negatief om vrij te geven. Toegelaten bereik ca. [0, {maxDelta}].
          </DialogDescription>
        </DialogHeader>

        <label className="flex flex-col gap-1 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Delta
          <Input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
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
            {saving ? "Bezig..." : "Bevestigen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
