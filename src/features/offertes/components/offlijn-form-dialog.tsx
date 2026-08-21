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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  createOfflijn,
  getArtikel,
  updateOfflijn,
  type CreateOfflijnPayload,
  type OfflijnItem,
  type UpdateOfflijnPayload,
} from "@/lib/api-client";
import { formatBedrag } from "@/lib/format";

export type OfflijnLineType = "artikel" | "kolomtitel" | "infolijn" | "subtotaal";

export function lineTypeOf(line: OfflijnItem): OfflijnLineType {
  if (line.kolomtitel) return "kolomtitel";
  if (line.infolijn) return "infolijn";
  if (line.subtotaal) return "subtotaal";
  return "artikel";
}

/**
 * groepnr of the nearest preceding kolomtitel line (0 if none exists yet) -
 * per the Fase 1 design, `groepnr`/`subgroepnr` are never user-editable;
 * this is computed client-side for every newly created line.
 */
export function deriveGroepnr(lines: OfflijnItem[]): number {
  const sorted = [...lines].sort((a, b) => a.lijnnr - b.lijnnr);
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].kolomtitel) return sorted[i].groepnr;
  }
  return 0;
}

/**
 * Sum of `bedrag` for the run of plain article lines immediately preceding
 * `beforeLijnnr` (or the whole list, for a brand-new line appended at the
 * end), stopping at - and not including - the previous
 * kolomtitel/subtotaal boundary. Client-side convenience sum only, no
 * server validation of correctness (see Fase 1 design).
 */
export function computeSubtotaalBedrag(lines: OfflijnItem[], beforeLijnnr?: number): number {
  const relevant =
    beforeLijnnr === undefined ? lines : lines.filter((line) => line.lijnnr < beforeLijnnr);
  const sorted = [...relevant].sort((a, b) => a.lijnnr - b.lijnnr);
  let sum = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const line = sorted[i];
    if (line.kolomtitel || line.subtotaal) break;
    if (!line.infolijn) sum += line.bedrag;
  }
  return sum;
}

type FormState = {
  type: OfflijnLineType;
  artnr: string;
  omschrijving: string;
  omschrijvingOfferte: string;
  aantal: string;
  korting: string;
  verkoopprijs: string;
  btwKode: string;
  brutoVerkoopprijs: string;
  bruto: string;
  aankoopprijs: string;
  teLeveren: string;
  bestellen: boolean;
  blokkeren: boolean;
};

const EMPTY_FORM: FormState = {
  type: "artikel",
  artnr: "",
  omschrijving: "",
  omschrijvingOfferte: "",
  aantal: "1",
  korting: "0",
  verkoopprijs: "0",
  btwKode: "",
  brutoVerkoopprijs: "0",
  bruto: "0",
  aankoopprijs: "0",
  teLeveren: "0",
  bestellen: false,
  blokkeren: false,
};

function lineToForm(line: OfflijnItem): FormState {
  return {
    type: lineTypeOf(line),
    artnr: line.artnr,
    omschrijving: line.omschrijving,
    omschrijvingOfferte: line.omschrijvingOfferte,
    aantal: String(line.aantal),
    korting: String(line.korting),
    verkoopprijs: String(line.verkoopprijs),
    btwKode: line.btwKode,
    brutoVerkoopprijs: String(line.brutoVerkoopprijs),
    bruto: String(line.bruto),
    aankoopprijs: String(line.aankoopprijs),
    teLeveren: String(line.teLeveren),
    bestellen: line.bestellen,
    blokkeren: line.blokkeren,
  };
}

/**
 * Create/edit dialog for a single offlijn. The caller is expected to
 * remount this component (e.g. via a `key` tied to the editing line's
 * lijnnr or "new") whenever it opens the dialog for a different line -
 * same convention as `BestellingPreviewDialog` in lakproductie - so all
 * form state here can be initialized once from props with no effects.
 */
export function OfflijnFormDialog({
  offnr,
  versie,
  open,
  onOpenChange,
  editingLine,
  lines,
  onSaved,
}: {
  offnr: number;
  versie: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLine: OfflijnItem | null;
  lines: OfflijnItem[];
  onSaved: (line: OfflijnItem) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    editingLine ? lineToForm(editingLine) : EMPTY_FORM
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const aantalNum = Number(form.aantal) || 0;
  const verkoopprijsNum = Number(form.verkoopprijs) || 0;
  const kortingNum = Number(form.korting) || 0;
  const artikelBedragPreview = aantalNum * verkoopprijsNum * (1 - kortingNum / 100);
  const subtotaalBedragPreview = computeSubtotaalBedrag(lines, editingLine?.lijnnr);

  async function handleLookup() {
    const target = form.artnr.trim();
    if (!target) return;
    setLookingUp(true);
    setError(null);
    try {
      const artikel = await getArtikel(target);
      if (!artikel) {
        setError(`Artikel ${target} niet gevonden.`);
        return;
      }
      setForm((prev) => ({
        ...prev,
        omschrijving: artikel.omschrijvingNl,
        omschrijvingOfferte: artikel.omschrijvingNl,
        verkoopprijs: String(artikel.verkoopprijs),
        btwKode: artikel.btwKode,
      }));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opzoeken van het artikel."
      );
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSave() {
    if (!form.omschrijvingOfferte.trim()) {
      setError("Omschrijving offerte is verplicht.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const isCreate = editingLine === null;
      const base = {
        omschrijvingOfferte: form.omschrijvingOfferte,
        subtotaal: form.type === "subtotaal",
        kolomtitel: form.type === "kolomtitel",
        infolijn: form.type === "infolijn",
      };

      let payload: CreateOfflijnPayload | UpdateOfflijnPayload;
      if (form.type === "artikel") {
        payload = {
          ...base,
          artnr: form.artnr,
          omschrijving: form.omschrijving,
          aantal: aantalNum,
          korting: kortingNum,
          verkoopprijs: verkoopprijsNum,
          btwKode: form.btwKode,
          bedrag: artikelBedragPreview,
          brutoVerkoopprijs: Number(form.brutoVerkoopprijs) || 0,
          bruto: Number(form.bruto) || 0,
          aankoopprijs: Number(form.aankoopprijs) || 0,
          teLeveren: Number(form.teLeveren) || 0,
          bestellen: form.bestellen,
          blokkeren: form.blokkeren,
        };
      } else if (form.type === "subtotaal") {
        payload = { ...base, bedrag: subtotaalBedragPreview };
      } else {
        payload = base;
      }

      if (isCreate) {
        const createPayload: CreateOfflijnPayload = {
          ...payload,
          groepnr: deriveGroepnr(lines),
          subgroepnr: 0,
        };
        const created = await createOfflijn(offnr, versie, createPayload);
        onSaved(created);
      } else {
        const updated = await updateOfflijn(offnr, versie, editingLine.lijnnr, payload);
        onSaved(updated);
      }
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de lijn.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingLine ? "Lijn bewerken" : "Lijn toevoegen"}</DialogTitle>
          <DialogDescription>
            Kies het type lijn en vul de bijbehorende velden in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="mb-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              Type lijn
            </div>
            <RadioGroup
              value={form.type}
              onValueChange={(value) => setField("type", value as OfflijnLineType)}
              className="grid grid-cols-2 gap-2"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="artikel" />
                Artikel
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="kolomtitel" />
                Sectie-titel
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="infolijn" />
                Infolijn
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="subtotaal" />
                Subtotaal
              </label>
            </RadioGroup>
          </div>

          {form.type === "artikel" && (
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <label className="flex-1 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                  Artnr
                  <Input
                    value={form.artnr}
                    onChange={(e) => setField("artnr", e.target.value)}
                    className="mt-1 font-normal normal-case"
                  />
                </label>
                <Button type="button" variant="outline" onClick={handleLookup} disabled={lookingUp}>
                  {lookingUp ? "Bezig..." : "Opzoeken"}
                </Button>
              </div>

              <label className="block text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Omschrijving offerte
                <Input
                  value={form.omschrijvingOfferte}
                  onChange={(e) => setField("omschrijvingOfferte", e.target.value)}
                  className="mt-1 font-normal normal-case"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
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
                  Korting (%)
                  <Input
                    type="number"
                    value={form.korting}
                    onChange={(e) => setField("korting", e.target.value)}
                    className="mt-1 font-normal normal-case"
                  />
                </label>
              </div>

              <div>
                <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                  Bedrag
                </div>
                <div className="mt-1 text-sm text-foreground" data-testid="artikel-bedrag-preview">
                  {formatBedrag(artikelBedragPreview)}
                </div>
              </div>

              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger
                  render={<Button type="button" variant="ghost" size="sm" className="-ml-2.5" />}
                >
                  Geavanceerd
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      Bruto verkoopprijs
                      <Input
                        type="number"
                        value={form.brutoVerkoopprijs}
                        onChange={(e) => setField("brutoVerkoopprijs", e.target.value)}
                        className="mt-1 font-normal normal-case"
                      />
                    </label>
                    <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      Bruto
                      <Input
                        type="number"
                        value={form.bruto}
                        onChange={(e) => setField("bruto", e.target.value)}
                        className="mt-1 font-normal normal-case"
                      />
                    </label>
                    <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      Aankoopprijs
                      <Input
                        type="number"
                        value={form.aankoopprijs}
                        onChange={(e) => setField("aankoopprijs", e.target.value)}
                        className="mt-1 font-normal normal-case"
                      />
                    </label>
                    <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      Te leveren
                      <Input
                        type="number"
                        value={form.teLeveren}
                        onChange={(e) => setField("teLeveren", e.target.value)}
                        className="mt-1 font-normal normal-case"
                      />
                    </label>
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                        Bestellen
                      </div>
                      <label className="mt-1 flex h-8 items-center gap-2">
                        <Checkbox
                          checked={form.bestellen}
                          onCheckedChange={() => setField("bestellen", !form.bestellen)}
                          aria-label="Bestellen"
                        />
                        <span className="text-sm text-foreground">
                          {form.bestellen ? "Ja" : "Nee"}
                        </span>
                      </label>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                        Blokkeren
                      </div>
                      <label className="mt-1 flex h-8 items-center gap-2">
                        <Checkbox
                          checked={form.blokkeren}
                          onCheckedChange={() => setField("blokkeren", !form.blokkeren)}
                          aria-label="Blokkeren"
                        />
                        <span className="text-sm text-foreground">
                          {form.blokkeren ? "Ja" : "Nee"}
                        </span>
                      </label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {(form.type === "kolomtitel" || form.type === "infolijn") && (
            <label className="block text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              Omschrijving offerte
              <Input
                value={form.omschrijvingOfferte}
                onChange={(e) => setField("omschrijvingOfferte", e.target.value)}
                className="mt-1 font-normal normal-case"
              />
            </label>
          )}

          {form.type === "subtotaal" && (
            <div className="space-y-4">
              <label className="block text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Omschrijving offerte
                <Input
                  value={form.omschrijvingOfferte}
                  onChange={(e) => setField("omschrijvingOfferte", e.target.value)}
                  className="mt-1 font-normal normal-case"
                />
              </label>
              <div>
                <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                  Bedrag (som van voorgaande lijnen)
                </div>
                <div
                  className="mt-1 text-sm text-foreground"
                  data-testid="subtotaal-bedrag-preview"
                >
                  {formatBedrag(subtotaalBedragPreview)}
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
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
