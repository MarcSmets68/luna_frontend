"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatBedrag, formatDatum } from "@/lib/format";
import { updateArtikel, type ArtikelItem, type UpdateArtikelPayload } from "@/lib/api-client";

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

function EditField({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="mt-1 font-normal normal-case"
        />
      </label>
    </div>
  );
}

function GeblokkeerdField({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        Geblokkeerd
      </div>
      <label className="mt-1 flex h-8 items-center gap-2">
        <Checkbox checked={value} onCheckedChange={onChange} aria-label="Geblokkeerd" />
        <span className="text-sm text-foreground">{value ? "Ja" : "Nee"}</span>
      </label>
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

// Bewerkbare velden op de artikelkaart - `artnr` (identificatie, immutable
// primary key op de backend), `voorraad` (aantal), `stock` en `datum` horen
// hier bewust niet bij.
type ArtikelFormState = {
  omschrijvingNl: string;
  omschrijvingFr: string;
  merk: string;
  groep: string;
  type: string;
  barcode: string;
  leverancierNr: string;
  gewicht: string;
  munt: string;
  btwKode: string;
  aankoopprijs: string;
  verkoopprijs: string;
  verkoopprijsIncl: string;
  voorraadMin: string;
  voorraadMax: string;
  geblokkeerd: boolean;
};

function toFormState(artikel: ArtikelItem): ArtikelFormState {
  return {
    omschrijvingNl: artikel.omschrijvingNl,
    omschrijvingFr: artikel.omschrijvingFr,
    merk: artikel.merk,
    groep: artikel.groep,
    type: artikel.type,
    barcode: artikel.barcode,
    leverancierNr: String(artikel.leverancierNr),
    gewicht: String(artikel.gewicht),
    munt: artikel.munt,
    btwKode: artikel.btwKode,
    aankoopprijs: String(artikel.aankoopprijs),
    verkoopprijs: String(artikel.verkoopprijs),
    verkoopprijsIncl: String(artikel.verkoopprijsIncl),
    voorraadMin: String(artikel.voorraadMin),
    voorraadMax: String(artikel.voorraadMax),
    geblokkeerd: artikel.geblokkeerd,
  };
}

export function ArtikelDetailPage({ artikel }: { artikel: ArtikelItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ArtikelFormState>(() => toFormState(artikel));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof ArtikelFormState>(key: K, value: ArtikelFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function startEditing() {
    setForm(toFormState(artikel));
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(toFormState(artikel));
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    const leverancierNr = Number(form.leverancierNr);
    const gewicht = Number(form.gewicht);
    const voorraadMin = Number(form.voorraadMin);
    const voorraadMax = Number(form.voorraadMax);

    if (Number.isNaN(leverancierNr) || leverancierNr < 0) {
      setError("Leverancier nr moet een geldig getal zijn.");
      return;
    }
    if (Number.isNaN(gewicht) || gewicht < 0) {
      setError("Gewicht moet een geldig getal zijn.");
      return;
    }
    if (Number.isNaN(voorraadMin) || voorraadMin < 0) {
      setError("Min. voorraad moet een geldig getal zijn.");
      return;
    }
    if (Number.isNaN(voorraadMax) || voorraadMax < 0) {
      setError("Max. voorraad moet een geldig getal zijn.");
      return;
    }
    if (voorraadMin > voorraadMax) {
      setError("Min. voorraad mag niet groter zijn dan max. voorraad.");
      return;
    }

    let aankoopprijs = 0;
    let verkoopprijs = 0;
    let verkoopprijsIncl = 0;
    if (!artikel.isSamengesteld) {
      aankoopprijs = Number(form.aankoopprijs);
      verkoopprijs = Number(form.verkoopprijs);
      verkoopprijsIncl = Number(form.verkoopprijsIncl);
      if (Number.isNaN(aankoopprijs) || aankoopprijs < 0) {
        setError("Aankoopprijs moet een geldig getal zijn.");
        return;
      }
      if (Number.isNaN(verkoopprijs) || verkoopprijs < 0) {
        setError("Verkoopprijs moet een geldig getal zijn.");
        return;
      }
      if (Number.isNaN(verkoopprijsIncl) || verkoopprijsIncl < 0) {
        setError("Verkoopprijs incl. moet een geldig getal zijn.");
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const payload: UpdateArtikelPayload = {
        omschrijvingNl: form.omschrijvingNl,
        omschrijvingFr: form.omschrijvingFr,
        merk: form.merk,
        groep: form.groep,
        type: form.type,
        barcode: form.barcode,
        leverancierNr,
        gewicht,
        munt: form.munt,
        btwKode: form.btwKode,
        voorraadMin,
        voorraadMax,
        geblokkeerd: form.geblokkeerd,
      };
      if (!artikel.isSamengesteld) {
        payload.aankoopprijs = aankoopprijs;
        payload.verkoopprijs = verkoopprijs;
        payload.verkoopprijsIncl = verkoopprijsIncl;
      }
      await updateArtikel(artikel.artnr, payload);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de artikelgegevens."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href="/voorraad"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Voorraad
      </div>
      <div className="mb-2 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">{artikel.omschrijvingNl || artikel.artnr}</h1>
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-[#5e5e5e]">Artikelnr {artikel.artnr}</div>
          {!editing && (
            <Button type="button" size="sm" onClick={startEditing}>
              Verbeteren
            </Button>
          )}
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {artikel.stock && <Badge variant="secondary">Stock</Badge>}
        {artikel.geblokkeerd && <Badge variant="destructive">Geblokkeerd</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Algemeen</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <FieldGroup>
                <DetailField label="Artikelnr" value={artikel.artnr} />
                <EditField label="Merk" value={form.merk} onChange={(v) => setField("merk", v)} />
                <EditField label="Groep" value={form.groep} onChange={(v) => setField("groep", v)} />
                <EditField label="Type" value={form.type} onChange={(v) => setField("type", v)} />
                <DetailField label="Datum" value={formatDatum(artikel.datum)} />
                <EditField
                  label="Leverancier nr"
                  value={form.leverancierNr}
                  onChange={(v) => setField("leverancierNr", v)}
                  type="number"
                />
                <EditField
                  label="Barcode"
                  value={form.barcode}
                  onChange={(v) => setField("barcode", v)}
                />
                <EditField
                  label="Omschrijving (N)"
                  value={form.omschrijvingNl}
                  onChange={(v) => setField("omschrijvingNl", v)}
                />
                <EditField
                  label="Omschrijving (F)"
                  value={form.omschrijvingFr}
                  onChange={(v) => setField("omschrijvingFr", v)}
                />
              </FieldGroup>
            ) : (
              <FieldGroup>
                <DetailField label="Artikelnr" value={artikel.artnr} />
                <DetailField label="Merk" value={artikel.merk} />
                <DetailField label="Groep" value={artikel.groep} />
                <DetailField label="Type" value={artikel.type} />
                <DetailField label="Datum" value={formatDatum(artikel.datum)} />
                <DetailField label="Leverancier nr" value={String(artikel.leverancierNr)} />
                <DetailField label="Barcode" value={artikel.barcode} />
                <DetailField label="Omschrijving (N)" value={artikel.omschrijvingNl} />
                <DetailField label="Omschrijving (F)" value={artikel.omschrijvingFr} />
              </FieldGroup>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prijzen</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <FieldGroup>
                <EditField label="Munt" value={form.munt} onChange={(v) => setField("munt", v)} />
                <EditField
                  label="BTW-kode"
                  value={form.btwKode}
                  onChange={(v) => setField("btwKode", v)}
                />
                <EditField
                  label="Aankoopprijs"
                  value={form.aankoopprijs}
                  onChange={(v) => setField("aankoopprijs", v)}
                  type="number"
                  disabled={artikel.isSamengesteld}
                />
                <EditField
                  label="Verkoopprijs"
                  value={form.verkoopprijs}
                  onChange={(v) => setField("verkoopprijs", v)}
                  type="number"
                  disabled={artikel.isSamengesteld}
                />
                <EditField
                  label="Verkoopprijs incl."
                  value={form.verkoopprijsIncl}
                  onChange={(v) => setField("verkoopprijsIncl", v)}
                  type="number"
                  disabled={artikel.isSamengesteld}
                />
              </FieldGroup>
            ) : (
              <FieldGroup>
                <DetailField label="Munt" value={artikel.munt} />
                <DetailField label="BTW-kode" value={artikel.btwKode} />
                <DetailField label="Aankoopprijs" value={formatBedrag(artikel.aankoopprijs)} />
                <DetailField label="Verkoopprijs" value={formatBedrag(artikel.verkoopprijs)} />
                <DetailField
                  label="Verkoopprijs incl."
                  value={formatBedrag(artikel.verkoopprijsIncl)}
                />
              </FieldGroup>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voorraadinformatie</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <FieldGroup>
                <DetailField label="Voorraad" value={String(artikel.voorraad)} />
                <EditField
                  label="Min. voorraad"
                  value={form.voorraadMin}
                  onChange={(v) => setField("voorraadMin", v)}
                  type="number"
                />
                <EditField
                  label="Max. voorraad"
                  value={form.voorraadMax}
                  onChange={(v) => setField("voorraadMax", v)}
                  type="number"
                />
                <EditField
                  label="Gewicht"
                  value={form.gewicht}
                  onChange={(v) => setField("gewicht", v)}
                  type="number"
                />
                <GeblokkeerdField
                  value={form.geblokkeerd}
                  onChange={() => setField("geblokkeerd", !form.geblokkeerd)}
                />
              </FieldGroup>
            ) : (
              <FieldGroup>
                <DetailField label="Voorraad" value={String(artikel.voorraad)} />
                <DetailField label="Min. voorraad" value={String(artikel.voorraadMin)} />
                <DetailField label="Max. voorraad" value={String(artikel.voorraadMax)} />
                <DetailField label="Gewicht" value={String(artikel.gewicht)} />
              </FieldGroup>
            )}
          </CardContent>
        </Card>
      </div>

      {editing && (
        <>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancelEditing} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Bezig..." : "Save"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
