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
import { Field } from "./field-input";
import { updateBon, type BonItem, type UpdateBonPayload } from "@/lib/api-client";

type FormState = {
  klnr2: string;
  klnr3: string;
  lnaam: string;
  lnaam1: string;
  ladres: string;
  lpostnr: string;
  lstad: string;
  recupelBedrag: string;
  aBedrag: string;
};

function toFormState(bon: BonItem): FormState {
  return {
    klnr2: String(bon.klnr2),
    klnr3: String(bon.klnr3),
    lnaam: bon.lnaam,
    lnaam1: bon.lnaam1,
    ladres: bon.ladres,
    lpostnr: bon.lpostnr,
    lstad: bon.lstad,
    recupelBedrag: String(bon.recupelBedrag),
    aBedrag: String(bon.aBedrag),
  };
}

/**
 * Edit dialog for a bon's extra klantnummers, afleveradres and extra
 * bedragen (klnr2/klnr3, lnaam/lnaam1/ladres/lpostnr/lstad,
 * recupelBedrag/aBedrag). Follows the same structural pattern as
 * LedConfigForm (local FormState of strings, aggregate numeric
 * validation, save handler with error surfacing).
 */
export function BonDetailEditDialog({
  bon,
  open,
  onOpenChange,
  onSaved,
}: {
  bon: BonItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: BonItem) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(bon));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(toFormState(bon));
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSave() {
    const numericFields = {
      klnr2: form.klnr2 === "" ? 0 : Number(form.klnr2),
      klnr3: form.klnr3 === "" ? 0 : Number(form.klnr3),
      recupelBedrag: form.recupelBedrag === "" ? 0 : Number(form.recupelBedrag),
      aBedrag: form.aBedrag === "" ? 0 : Number(form.aBedrag),
    };
    if (Object.values(numericFields).some((n) => Number.isNaN(n))) {
      setError(
        "Alle numerieke velden (Klnr2, Klnr3, Recupel bedrag, A-bedrag) moeten geldige getallen zijn."
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: UpdateBonPayload = {
        ...numericFields,
        lnaam: form.lnaam.trim(),
        lnaam1: form.lnaam1.trim(),
        ladres: form.ladres.trim(),
        lpostnr: form.lpostnr.trim(),
        lstad: form.lstad.trim(),
      };
      const updated = await updateBon(bon.bonnr, payload);
      onSaved(updated);
      handleOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de ordergegevens."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ordergegevens bewerken</DialogTitle>
        </DialogHeader>

        <div>
          <div className="mb-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Extra klantnummers
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Klnr2" value={form.klnr2} onChange={(v) => setField("klnr2", v)} type="number" />
            <Field label="Klnr3" value={form.klnr3} onChange={(v) => setField("klnr3", v)} type="number" />
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Afleveradres
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Naam" value={form.lnaam} onChange={(v) => setField("lnaam", v)} />
            <Field label="Naam 1" value={form.lnaam1} onChange={(v) => setField("lnaam1", v)} />
            <Field label="Adres" value={form.ladres} onChange={(v) => setField("ladres", v)} />
            <Field label="Postnr" value={form.lpostnr} onChange={(v) => setField("lpostnr", v)} />
            <Field label="Stad" value={form.lstad} onChange={(v) => setField("lstad", v)} />
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Bedragen (extra)
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Recupel bedrag"
              value={form.recupelBedrag}
              onChange={(v) => setField("recupelBedrag", v)}
              type="number"
            />
            <Field label="A-bedrag" value={form.aBedrag} onChange={(v) => setField("aBedrag", v)} type="number" />
          </div>
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
