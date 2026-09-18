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
  createBonLedLijn,
  updateBonLedLijn,
  type BonLedItem,
  type CreateBonLedPayload,
} from "@/lib/api-client";
import { Field } from "./field-input";

type FormState = {
  groepnr: string;
  ledLijn: string;
  docLijnnr: string;
  soort: string;
  kode: string;
  artnr: string;
  aantal: string;
  lengte: string;
  lMaat: string;
  rMaat: string;
  switch1: string;
  switch2: string;
  reflector: string;
  prijs: string;
  montagePrijs: string;
  circuit: string;
  comp: string;
  sturing: string;
  opm: string;
  siktaKleurKodes: string[];
};

function toFormState(item?: BonLedItem): FormState {
  return {
    groepnr: item ? String(item.groepnr) : "1",
    ledLijn: item ? String(item.ledLijn) : "1",
    docLijnnr: item ? String(item.docLijnnr) : "1",
    soort: item?.soort ?? "",
    kode: item?.kode ?? "",
    artnr: item?.artnr ?? "",
    aantal: item ? String(item.aantal) : "0",
    lengte: item ? String(item.lengte) : "0",
    lMaat: item ? String(item.lMaat) : "0",
    rMaat: item ? String(item.rMaat) : "0",
    switch1: item?.switch1 ?? "",
    switch2: item?.switch2 ?? "",
    reflector: item?.reflector ?? "",
    prijs: item ? String(item.prijs) : "0",
    montagePrijs: item ? String(item.montagePrijs) : "0",
    circuit: item?.circuit ?? "",
    comp: item?.comp ?? "",
    sturing: item?.sturing ?? "",
    opm: item?.opm ?? "",
    siktaKleurKodes: item?.siktaKleurKodes ?? ["", "", "", "", ""],
  };
}

/**
 * Create/edit form for a LED-configuratielijn (bon_led). `siktaKleurKodes[1]`
 * (index 1, the 2nd kleurkode) is enforced required client-side to match
 * the backend's 400 validation - but the server's exact error message is
 * always surfaced verbatim if it still occurs (e.g. race conditions).
 */
export function LedConfigForm({
  bonnr,
  item,
  open,
  onOpenChange,
  onSaved,
}: {
  bonnr: number;
  item?: BonLedItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved: BonLedItem) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function setKleurKode(index: number, value: string) {
    setForm((prev) => {
      const next = [...prev.siktaKleurKodes];
      next[index] = value;
      return { ...prev, siktaKleurKodes: next };
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(toFormState(item));
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSave() {
    if (!form.siktaKleurKodes[1]) {
      setError("Kleurkode 2 (siktaKleurKodes[1]) is verplicht.");
      return;
    }

    const numericFields = {
      groepnr: Number(form.groepnr),
      ledLijn: Number(form.ledLijn),
      docLijnnr: Number(form.docLijnnr),
      aantal: Number(form.aantal),
      lengte: Number(form.lengte),
      lMaat: Number(form.lMaat),
      rMaat: Number(form.rMaat),
      prijs: Number(form.prijs),
      montagePrijs: Number(form.montagePrijs),
    };
    if (Object.values(numericFields).some((n) => Number.isNaN(n))) {
      setError("Alle numerieke velden moeten geldige getallen zijn.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CreateBonLedPayload = {
        ...numericFields,
        soort: form.soort,
        kode: form.kode,
        artnr: form.artnr,
        switch1: form.switch1,
        switch2: form.switch2,
        reflector: form.reflector,
        circuit: form.circuit,
        comp: form.comp,
        sturing: form.sturing,
        opm: form.opm,
        siktaKleurKodes: form.siktaKleurKodes,
      };
      const saved = item
        ? await updateBonLedLijn(bonnr, item.groepnr, item.ledLijn, item.lijnnr, payload)
        : await createBonLedLijn(bonnr, payload);
      onSaved(saved);
      handleOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de LED-configuratie."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "LED-lijn bewerken" : "LED-lijn toevoegen"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Groepnr" value={form.groepnr} onChange={(v) => setField("groepnr", v)} type="number" />
          <Field label="Ledlijn" value={form.ledLijn} onChange={(v) => setField("ledLijn", v)} type="number" />
          <Field label="Doclijnnr" value={form.docLijnnr} onChange={(v) => setField("docLijnnr", v)} type="number" />
          <Field label="Soort" value={form.soort} onChange={(v) => setField("soort", v)} />
          <Field label="Kode" value={form.kode} onChange={(v) => setField("kode", v)} />
          <Field label="Artnr" value={form.artnr} onChange={(v) => setField("artnr", v)} />
          <Field label="Aantal" value={form.aantal} onChange={(v) => setField("aantal", v)} type="number" />
          <Field label="Lengte" value={form.lengte} onChange={(v) => setField("lengte", v)} type="number" />
          <Field label="L-maat" value={form.lMaat} onChange={(v) => setField("lMaat", v)} type="number" />
          <Field label="R-maat" value={form.rMaat} onChange={(v) => setField("rMaat", v)} type="number" />
          <Field label="Switch 1" value={form.switch1} onChange={(v) => setField("switch1", v)} />
          <Field label="Switch 2" value={form.switch2} onChange={(v) => setField("switch2", v)} />
          <Field label="Reflector" value={form.reflector} onChange={(v) => setField("reflector", v)} />
          <Field label="Prijs" value={form.prijs} onChange={(v) => setField("prijs", v)} type="number" />
          <Field
            label="Montageprijs"
            value={form.montagePrijs}
            onChange={(v) => setField("montagePrijs", v)}
            type="number"
          />
          <Field label="Circuit" value={form.circuit} onChange={(v) => setField("circuit", v)} />
          <Field label="Comp" value={form.comp} onChange={(v) => setField("comp", v)} />
          <Field label="Sturing" value={form.sturing} onChange={(v) => setField("sturing", v)} />
          <Field label="Opmerking" value={form.opm} onChange={(v) => setField("opm", v)} />
        </div>

        <div>
          <div className="mb-1 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Sikta kleurkodes (kleurkode 2 verplicht)
          </div>
          <div className="grid grid-cols-5 gap-2">
            {form.siktaKleurKodes.map((code, index) => (
              <Input
                key={index}
                value={code}
                aria-label={`Kleurkode ${index + 1}`}
                onChange={(e) => setKleurKode(index, e.target.value)}
              />
            ))}
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
