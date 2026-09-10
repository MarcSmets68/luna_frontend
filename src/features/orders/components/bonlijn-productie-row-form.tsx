"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createBonLijnProductie,
  updateBonLijnProductie,
  type BonLijnProductieItem,
} from "@/lib/api-client";

type FormState = {
  artnr: string;
  omschr: string;
  aantal: string;
  gereserv: string;
  effectiefGereserv: string;
  swEffectief: boolean;
  besteld: string;
};

function toFormState(item?: BonLijnProductieItem): FormState {
  return {
    artnr: item?.artnr ?? "",
    omschr: item?.omschr ?? "",
    aantal: item ? String(item.aantal) : "0",
    gereserv: item ? String(item.gereserv) : "0",
    effectiefGereserv: item ? String(item.effectiefGereserv) : "0",
    swEffectief: item?.swEffectief ?? false,
    besteld: item ? String(item.besteld) : "0",
  };
}

/**
 * Create/edit form for a productie-sublijn (bonlijn_productie), rendered
 * in a dialog. Pass `item` to edit an existing sublijn, omit it to create
 * a new one.
 */
export function BonlijnProductieRowForm({
  bonnr,
  blijnnr,
  item,
  open,
  onOpenChange,
  onSaved,
}: {
  bonnr: number;
  blijnnr: number;
  item?: BonLijnProductieItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved: BonLijnProductieItem) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(toFormState(item));
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSave() {
    const aantal = Number(form.aantal);
    const gereserv = Number(form.gereserv);
    const effectiefGereserv = Number(form.effectiefGereserv);
    const besteld = Number(form.besteld);
    if ([aantal, gereserv, effectiefGereserv, besteld].some((n) => Number.isNaN(n))) {
      setError("Alle numerieke velden moeten geldige getallen zijn.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        artnr: form.artnr,
        omschr: form.omschr,
        aantal,
        gereserv,
        effectiefGereserv,
        swEffectief: form.swEffectief,
        besteld,
      };
      const saved = item
        ? await updateBonLijnProductie(bonnr, blijnnr, item.lijnnr, payload)
        : await createBonLijnProductie(bonnr, blijnnr, payload);
      onSaved(saved);
      handleOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de productielijn."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Productielijn bewerken" : "Productielijn toevoegen"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Artnr
            <Input
              value={form.artnr}
              onChange={(e) => setField("artnr", e.target.value)}
              className="mt-1 font-normal normal-case"
            />
          </label>
          <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Omschrijving
            <Input
              value={form.omschr}
              onChange={(e) => setField("omschr", e.target.value)}
              className="mt-1 font-normal normal-case"
            />
          </label>
          <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Aantal
            <Input
              type="number"
              value={form.aantal}
              onChange={(e) => setField("aantal", e.target.value)}
              className="mt-1 font-normal normal-case"
            />
          </label>
          <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Besteld
            <Input
              type="number"
              value={form.besteld}
              onChange={(e) => setField("besteld", e.target.value)}
              className="mt-1 font-normal normal-case"
            />
          </label>
          <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Gereserveerd
            <Input
              type="number"
              value={form.gereserv}
              onChange={(e) => setField("gereserv", e.target.value)}
              className="mt-1 font-normal normal-case"
            />
          </label>
          <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Effectief gereserveerd
            <Input
              type="number"
              value={form.effectiefGereserv}
              onChange={(e) => setField("effectiefGereserv", e.target.value)}
              className="mt-1 font-normal normal-case"
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            <Checkbox
              checked={form.swEffectief}
              onCheckedChange={() => setField("swEffectief", !form.swEffectief)}
              aria-label="Sw effectief"
            />
            Sw effectief
          </label>
        </div>

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
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Bezig..." : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
