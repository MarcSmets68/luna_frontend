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
import {
  createPaklijn,
  updatePaklijn,
  type PaklijnItem,
  type CreatePaklijnPayload,
} from "@/lib/api-client";

type FormState = {
  groepnr: string;
  subgroepnr: string;
  artnr: string;
  omschr: string;
  aantal: string;
  teLeveren: string;
  afgehaald: string;
  vprijs: string;
  aprijs: string;
  korting: string;
  btwKode: string;
  bedrag: string;
  stempel: string;
  klnr: string;
  bonnr: string;
  blijnnr: string;
  hold: boolean;
  swLed: boolean;
  swSikta: boolean;
  subtotaal: boolean;
  kolomtitel: boolean;
  infolijn: boolean;
  opm: string;
};

function toFormState(item?: PaklijnItem): FormState {
  return {
    groepnr: item ? String(item.groepnr) : "1",
    subgroepnr: item ? String(item.subgroepnr) : "1",
    artnr: item?.artnr ?? "",
    omschr: item?.omschr ?? "",
    aantal: item ? String(item.aantal) : "0",
    teLeveren: item ? String(item.teLeveren) : "0",
    afgehaald: item ? String(item.afgehaald) : "0",
    vprijs: item ? String(item.vprijs) : "0",
    aprijs: item ? String(item.aprijs) : "0",
    korting: item ? String(item.korting) : "0",
    btwKode: item?.btwKode ?? "",
    bedrag: item ? String(item.bedrag) : "0",
    stempel: item?.stempel ?? "",
    klnr: item ? String(item.klnr) : "0",
    bonnr: item ? String(item.bonnr) : "0",
    blijnnr: item ? String(item.blijnnr) : "0",
    hold: item?.hold ?? false,
    swLed: item?.swLed ?? false,
    swSikta: item?.swSikta ?? false,
    subtotaal: item?.subtotaal ?? false,
    kolomtitel: item?.kolomtitel ?? false,
    infolijn: item?.infolijn ?? false,
    opm: item?.opm ?? "",
  };
}

/** Create/edit form for a paklijn, rendered in a dialog. */
export function PaklijnRowForm({
  paknr,
  item,
  open,
  onOpenChange,
  onSaved,
}: {
  paknr: number;
  item?: PaklijnItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved: PaklijnItem) => void;
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
    const numericFields = {
      groepnr: Number(form.groepnr),
      subgroepnr: Number(form.subgroepnr),
      aantal: Number(form.aantal),
      teLeveren: Number(form.teLeveren),
      afgehaald: Number(form.afgehaald),
      vprijs: Number(form.vprijs),
      aprijs: Number(form.aprijs),
      korting: Number(form.korting),
      bedrag: Number(form.bedrag),
      klnr: Number(form.klnr),
      bonnr: Number(form.bonnr),
      blijnnr: Number(form.blijnnr),
    };
    if (Object.values(numericFields).some((n) => Number.isNaN(n))) {
      setError("Alle numerieke velden moeten geldige getallen zijn.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CreatePaklijnPayload = {
        ...numericFields,
        artnr: form.artnr,
        omschr: form.omschr,
        btwKode: form.btwKode,
        stempel: form.stempel,
        hold: form.hold,
        swLed: form.swLed,
        swSikta: form.swSikta,
        subtotaal: form.subtotaal,
        kolomtitel: form.kolomtitel,
        infolijn: form.infolijn,
        opm: form.opm,
      };
      const saved = item
        ? await updatePaklijn(paknr, item.lijnnr, payload)
        : await createPaklijn(paknr, payload);
      onSaved(saved);
      handleOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de paklijn."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Paklijn bewerken" : "Paklijn toevoegen"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Artnr" value={form.artnr} onChange={(v) => setField("artnr", v)} />
          <Field label="Omschrijving" value={form.omschr} onChange={(v) => setField("omschr", v)} />
          <Field label="Aantal" value={form.aantal} onChange={(v) => setField("aantal", v)} type="number" />
          <Field
            label="Te leveren"
            value={form.teLeveren}
            onChange={(v) => setField("teLeveren", v)}
            type="number"
          />
          <Field
            label="Afgehaald"
            value={form.afgehaald}
            onChange={(v) => setField("afgehaald", v)}
            type="number"
          />
          <Field label="Vprijs" value={form.vprijs} onChange={(v) => setField("vprijs", v)} type="number" />
          <Field label="Korting" value={form.korting} onChange={(v) => setField("korting", v)} type="number" />
          <Field label="Bedrag" value={form.bedrag} onChange={(v) => setField("bedrag", v)} type="number" />
          <Field label="Bonnr" value={form.bonnr} onChange={(v) => setField("bonnr", v)} type="number" />
          <Field label="Blijnnr" value={form.blijnnr} onChange={(v) => setField("blijnnr", v)} type="number" />
          <Field label="Opmerking" value={form.opm} onChange={(v) => setField("opm", v)} />
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

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
      {label}
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 font-normal normal-case"
      />
    </label>
  );
}
