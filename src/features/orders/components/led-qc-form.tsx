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
  createBonLedQc,
  updateBonLedQc,
  type BonLedQcItem,
  type CreateBonLedQcPayload,
} from "@/lib/api-client";

type FormState = {
  groepnr: string;
  lijnnr: string;
  datum: string;
  omschr: string;
  controle: boolean;
  id: string;
  info: string;
  swInfo: boolean;
};

function toFormState(item?: BonLedQcItem): FormState {
  return {
    groepnr: item ? String(item.groepnr) : "1",
    lijnnr: item ? String(item.lijnnr) : "1",
    datum: item?.datum ?? "",
    omschr: item?.omschr ?? "",
    controle: item?.controle ?? false,
    id: item?.id ?? "",
    info: item?.info ?? "",
    swInfo: item?.swInfo ?? false,
  };
}

/** Create/edit form for a QC-registratie (bon_led_qc), in a dialog. */
export function LedQcForm({
  bonnr,
  item,
  open,
  onOpenChange,
  onSaved,
}: {
  bonnr: number;
  item?: BonLedQcItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved: BonLedQcItem) => void;
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
    const groepnr = Number(form.groepnr);
    const lijnnr = Number(form.lijnnr);
    if (Number.isNaN(groepnr) || Number.isNaN(lijnnr)) {
      setError("Groepnr en lijnnr moeten geldige getallen zijn.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CreateBonLedQcPayload = {
        groepnr,
        lijnnr,
        datum: form.datum || null,
        omschr: form.omschr,
        controle: form.controle,
        id: form.id,
        info: form.info,
        swInfo: form.swInfo,
      };
      const saved = item
        ? await updateBonLedQc(bonnr, item.groepnr, item.volgnr, item.lijnnr, payload)
        : await createBonLedQc(bonnr, payload);
      onSaved(saved);
      handleOpenChange(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de QC-registratie."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "QC-registratie bewerken" : "QC-registratie toevoegen"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Field label="Groepnr" value={form.groepnr} onChange={(v) => setField("groepnr", v)} type="number" />
          <Field label="Lijnnr" value={form.lijnnr} onChange={(v) => setField("lijnnr", v)} type="number" />
          <Field label="Datum" value={form.datum} onChange={(v) => setField("datum", v)} type="date" />
          <Field label="Omschrijving" value={form.omschr} onChange={(v) => setField("omschr", v)} />
          <Field label="Id" value={form.id} onChange={(v) => setField("id", v)} />
          <Field label="Info" value={form.info} onChange={(v) => setField("info", v)} />
          <label className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            <Checkbox
              checked={form.controle}
              onCheckedChange={() => setField("controle", !form.controle)}
              aria-label="Controle"
            />
            Controle
          </label>
          <label className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            <Checkbox
              checked={form.swInfo}
              onCheckedChange={() => setField("swInfo", !form.swInfo)}
              aria-label="Sw info"
            />
            Sw info
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
