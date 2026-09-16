"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatDatum } from "@/lib/format";
import {
  createBonHerstel,
  getBonHerstel,
  updateBonHerstel,
  type BonHerstelItem,
  type CreateBonHerstelPayload,
} from "@/lib/api-client";
import { HerstelStatusActions } from "./herstel-status-actions";

type FormState = {
  artnr: string;
  omschr: string;
  probleem: string;
  bestek: string;
  bestekKosten: string;
  herstelling: string;
  refLev: string;
  rapnr: string;
  levnr: string;
  locatie: string;
  technieker: string;
  maxKosten: string;
  garantie: boolean;
  prior: string;
  opmTechn: string;
};

function toFormState(item?: BonHerstelItem | null): FormState {
  return {
    artnr: item?.artnr ?? "",
    omschr: item?.omschr ?? "",
    probleem: item?.probleem ?? "",
    bestek: item?.bestek ?? "",
    bestekKosten: item ? String(item.bestekKosten) : "0",
    herstelling: item?.herstelling ?? "",
    refLev: item?.refLev ?? "",
    rapnr: item?.rapnr ?? "",
    levnr: item ? String(item.levnr) : "0",
    locatie: item?.locatie ?? "",
    technieker: item?.technieker ?? "",
    maxKosten: item ? String(item.maxKosten) : "0",
    garantie: item?.garantie ?? false,
    prior: item ? String(item.prior) : "0",
    opmTechn: item?.opmTechn ?? "",
  };
}

/**
 * Herstel-tabblad - enkel relevant voor bonnen van type "HERSTELLING"
 * (gecontroleerd door de aanroeper). Laadt/creëert/bewerkt het
 * bon_herstel-dossier en toont de statustransitie-knoppen.
 */
export function HerstelDetailPanel({ bonnr }: { bonnr: number }) {
  const [herstel, setHerstel] = useState<BonHerstelItem | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toFormState());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBonHerstel(bonnr)
      .then((data) => {
        if (!cancelled) {
          setHerstel(data);
          setForm(toFormState(data));
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Er ging iets mis bij het laden van het herstel-dossier."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bonnr]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    const bestekKosten = Number(form.bestekKosten);
    const levnr = Number(form.levnr);
    const maxKosten = Number(form.maxKosten);
    const prior = Number(form.prior);
    if ([bestekKosten, levnr, maxKosten, prior].some((n) => Number.isNaN(n))) {
      setSaveError("Alle numerieke velden moeten geldige getallen zijn.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const shared = {
        artnr: form.artnr,
        omschr: form.omschr,
        probleem: form.probleem,
        bestek: form.bestek,
        bestekKosten,
        herstelling: form.herstelling,
        refLev: form.refLev,
        rapnr: form.rapnr,
        levnr,
        locatie: form.locatie,
        technieker: form.technieker,
        maxKosten,
        garantie: form.garantie,
        prior,
        opmTechn: form.opmTechn,
      };
      const saved = herstel
        ? await updateBonHerstel(bonnr, shared)
        : await createBonHerstel(bonnr, {
            ...shared,
            facnr: 0,
            facDatum: null,
            ordnr: 0,
            levDatum: null,
            stempel: "ONTVANGST",
            datum: null,
            herstelDatum: null,
            herstelLocatieDatum: null,
          } as CreateBonHerstelPayload);
      setHerstel(saved);
      setForm(toFormState(saved));
      setEditing(false);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van het herstel-dossier."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>;
  }

  if (herstel === undefined) {
    return <p className="text-sm text-muted-foreground">Herstel-dossier laden...</p>;
  }

  return (
    <div>
      {herstel && (
        <div className="mb-4 flex items-center justify-between">
          <Badge>{herstel.stempel}</Badge>
          {!editing && (
            <Button type="button" size="sm" onClick={() => setEditing(true)}>
              Bewerken
            </Button>
          )}
        </div>
      )}

      {herstel && !editing && (
        <div className="mb-6">
          <HerstelStatusActions bonnr={bonnr} herstel={herstel} onUpdated={setHerstel} />
        </div>
      )}

      <Card>
        <CardContent>
          {!herstel && !editing ? (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">
                Nog geen herstel-dossier voor deze bon.
              </p>
              <Button type="button" size="sm" onClick={() => setEditing(true)}>
                Herstel-dossier aanmaken
              </Button>
            </div>
          ) : editing ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Artnr" value={form.artnr} onChange={(v) => setField("artnr", v)} />
                <Field label="Omschrijving" value={form.omschr} onChange={(v) => setField("omschr", v)} />
                <Field label="Probleem" value={form.probleem} onChange={(v) => setField("probleem", v)} />
                <Field label="Bestek" value={form.bestek} onChange={(v) => setField("bestek", v)} />
                <Field
                  label="Bestekkosten"
                  value={form.bestekKosten}
                  onChange={(v) => setField("bestekKosten", v)}
                  type="number"
                />
                <Field
                  label="Herstelling"
                  value={form.herstelling}
                  onChange={(v) => setField("herstelling", v)}
                />
                <Field label="Ref. leverancier" value={form.refLev} onChange={(v) => setField("refLev", v)} />
                <Field label="Rapnr" value={form.rapnr} onChange={(v) => setField("rapnr", v)} />
                <Field label="Levnr" value={form.levnr} onChange={(v) => setField("levnr", v)} type="number" />
                <Field label="Locatie" value={form.locatie} onChange={(v) => setField("locatie", v)} />
                <Field
                  label="Technieker"
                  value={form.technieker}
                  onChange={(v) => setField("technieker", v)}
                />
                <Field
                  label="Max. kosten"
                  value={form.maxKosten}
                  onChange={(v) => setField("maxKosten", v)}
                  type="number"
                />
                <Field label="Prioriteit" value={form.prior} onChange={(v) => setField("prior", v)} type="number" />
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                    Garantie
                  </div>
                  <label className="mt-1 flex h-8 items-center gap-2">
                    <Checkbox
                      checked={form.garantie}
                      onCheckedChange={() => setField("garantie", !form.garantie)}
                      aria-label="Garantie"
                    />
                    <span className="text-sm text-foreground">{form.garantie ? "Ja" : "Nee"}</span>
                  </label>
                </div>
                <Field
                  label="Opmerking technieker"
                  value={form.opmTechn}
                  onChange={(v) => setField("opmTechn", v)}
                />
              </div>

              {saveError && <p className="mt-4 text-sm text-destructive">{saveError}</p>}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(toFormState(herstel));
                    setSaveError(null);
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  Annuleren
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? "Bezig..." : "Opslaan"}
                </Button>
              </div>
            </>
          ) : (
            herstel && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Artnr" value={herstel.artnr} />
                <DetailField label="Omschrijving" value={herstel.omschr} />
                <DetailField label="Probleem" value={herstel.probleem} />
                <DetailField label="Bestek" value={herstel.bestek} />
                <DetailField label="Bestekkosten" value={String(herstel.bestekKosten)} />
                <DetailField label="Herstelling" value={herstel.herstelling} />
                <DetailField label="Facnr" value={String(herstel.facnr)} />
                <DetailField label="Factuurdatum" value={formatDatum(herstel.facDatum)} />
                <DetailField label="Ordnr" value={String(herstel.ordnr)} />
                <DetailField label="Leverdatum" value={formatDatum(herstel.levDatum)} />
                <DetailField label="Ref. leverancier" value={herstel.refLev} />
                <DetailField label="Rapnr" value={herstel.rapnr} />
                <DetailField label="Levnr" value={String(herstel.levnr)} />
                <DetailField label="Locatie" value={herstel.locatie} />
                <DetailField label="HerstelDatum" value={formatDatum(herstel.herstelDatum)} />
                <DetailField
                  label="Herstel locatie datum"
                  value={formatDatum(herstel.herstelLocatieDatum)}
                />
                <DetailField label="Technieker" value={herstel.technieker} />
                <DetailField label="Max. kosten" value={String(herstel.maxKosten)} />
                <DetailField label="Garantie" value={herstel.garantie ? "Ja" : "Nee"} />
                <DetailField label="Prioriteit" value={String(herstel.prior)} />
                <DetailField label="Opmerking technieker" value={herstel.opmTechn} />
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-sm text-foreground">{value || "\u2014"}</div>
    </div>
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
