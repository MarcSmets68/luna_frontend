"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { DeleteLeverancierDialog } from "./delete-leverancier-dialog";
import {
  updateLeverancier,
  type LeverancierItem,
  type UpdateLeverancierPayload,
} from "@/lib/api-client";

function formatSaldo(value: number): string {
  return value.toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function EditField({
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
    <div>
      <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 font-normal normal-case"
        />
      </label>
    </div>
  );
}

// Bewerkbare velden op de leverancierskaart - `levnr` (identificatie,
// immutable primary key op de backend) horen hier bewust niet bij.
type LeverancierFormState = {
  naam: string;
  naam1: string;
  contact: string;
  adres: string;
  postnr: string;
  stad: string;
  land: string;
  tel: string;
  fax: string;
  email: string;
  taal: string;
  munt: string;
  btwNr: string;
  saldo: string;
  opm: string;
  type: boolean;
  controle: boolean;
  minBestel: string;
  btwRegime: string;
};

function toFormState(leverancier: LeverancierItem): LeverancierFormState {
  return {
    naam: leverancier.naam,
    naam1: leverancier.naam1,
    contact: leverancier.contact,
    adres: leverancier.adres,
    postnr: leverancier.postnr,
    stad: leverancier.stad,
    land: leverancier.land,
    tel: leverancier.tel,
    fax: leverancier.fax,
    email: leverancier.email,
    taal: leverancier.taal,
    munt: leverancier.munt,
    btwNr: leverancier.btwNr,
    saldo: String(leverancier.saldo),
    opm: leverancier.opm,
    type: leverancier.type,
    controle: leverancier.controle,
    minBestel: String(leverancier.minBestel),
    btwRegime: String(leverancier.btwRegime),
  };
}

export function LeverancierDetailPage({ leverancier }: { leverancier: LeverancierItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<LeverancierFormState>(() => toFormState(leverancier));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const setField = <K extends keyof LeverancierFormState>(
    key: K,
    value: LeverancierFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  function startEditing() {
    setForm(toFormState(leverancier));
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(toFormState(leverancier));
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    const saldo = Number(form.saldo);
    if (Number.isNaN(saldo)) {
      setError("Saldo moet een geldig getal zijn.");
      return;
    }

    const minBestel = Number(form.minBestel);
    if (Number.isNaN(minBestel)) {
      setError("Min. bestelling moet een geldig getal zijn.");
      return;
    }

    const btwRegime = Number(form.btwRegime);
    if (Number.isNaN(btwRegime)) {
      setError("BTW-regime moet een geldig getal zijn.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: UpdateLeverancierPayload = { ...form, saldo, minBestel, btwRegime };
      await updateLeverancier(leverancier.levnr, payload);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Er ging iets mis bij het opslaan van de leveranciersgegevens."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href="/leveranciers"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Leveranciers
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">{leverancier.naam}</h1>
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-[#5e5e5e]">Levnr {leverancier.levnr}</div>
          {!editing && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                Verwijderen
              </Button>
              <Button type="button" size="sm" onClick={startEditing}>
                Verbeteren
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardContent>
          {editing ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Levnr" value={String(leverancier.levnr)} />
                <EditField label="Naam" value={form.naam} onChange={(v) => setField("naam", v)} />
                <EditField
                  label="Naam 1"
                  value={form.naam1}
                  onChange={(v) => setField("naam1", v)}
                />
                <EditField
                  label="Contact"
                  value={form.contact}
                  onChange={(v) => setField("contact", v)}
                />
                <EditField
                  label="Adres"
                  value={form.adres}
                  onChange={(v) => setField("adres", v)}
                />
                <EditField
                  label="Postnr"
                  value={form.postnr}
                  onChange={(v) => setField("postnr", v)}
                />
                <EditField label="Stad" value={form.stad} onChange={(v) => setField("stad", v)} />
                <EditField label="Land" value={form.land} onChange={(v) => setField("land", v)} />
                <EditField label="Telefoon" value={form.tel} onChange={(v) => setField("tel", v)} />
                <EditField label="Fax" value={form.fax} onChange={(v) => setField("fax", v)} />
                <EditField
                  label="E-mail"
                  value={form.email}
                  onChange={(v) => setField("email", v)}
                  type="email"
                />
                <EditField label="Taal" value={form.taal} onChange={(v) => setField("taal", v)} />
                <EditField label="Munt" value={form.munt} onChange={(v) => setField("munt", v)} />
                <EditField
                  label="BTW-nr"
                  value={form.btwNr}
                  onChange={(v) => setField("btwNr", v)}
                />
                <EditField
                  label="BTW-regime"
                  value={form.btwRegime}
                  onChange={(v) => setField("btwRegime", v)}
                  type="number"
                />
                <EditField
                  label="Saldo"
                  value={form.saldo}
                  onChange={(v) => setField("saldo", v)}
                  type="number"
                />
                <EditField
                  label="Min. bestelling"
                  value={form.minBestel}
                  onChange={(v) => setField("minBestel", v)}
                  type="number"
                />
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                    Type
                  </div>
                  <label className="mt-1 flex h-8 items-center gap-2">
                    <Checkbox
                      checked={form.type}
                      onCheckedChange={() => setField("type", !form.type)}
                      aria-label="Type"
                    />
                    <span className="text-sm text-foreground">{form.type ? "Ja" : "Nee"}</span>
                  </label>
                </div>
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                    Controle
                  </div>
                  <label className="mt-1 flex h-8 items-center gap-2">
                    <Checkbox
                      checked={form.controle}
                      onCheckedChange={() => setField("controle", !form.controle)}
                      aria-label="Controle"
                    />
                    <span className="text-sm text-foreground">
                      {form.controle ? "Ja" : "Nee"}
                    </span>
                  </label>
                </div>
                <EditField label="Opmerking" value={form.opm} onChange={(v) => setField("opm", v)} />
              </div>

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
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Levnr" value={String(leverancier.levnr)} />
              <DetailField label="Naam" value={leverancier.naam} />
              <DetailField label="Naam 1" value={leverancier.naam1} />
              <DetailField label="Contact" value={leverancier.contact} />
              <DetailField label="Adres" value={leverancier.adres} />
              <DetailField label="Postnr" value={leverancier.postnr} />
              <DetailField label="Stad" value={leverancier.stad} />
              <DetailField label="Land" value={leverancier.land} />
              <DetailField label="Telefoon" value={leverancier.tel} />
              <DetailField label="Fax" value={leverancier.fax} />
              <DetailField label="E-mail" value={leverancier.email} />
              <DetailField label="Taal" value={leverancier.taal} />
              <DetailField label="Munt" value={leverancier.munt} />
              <DetailField label="BTW-nr" value={leverancier.btwNr} />
              <DetailField label="BTW-regime" value={String(leverancier.btwRegime)} />
              <DetailField label="Saldo" value={formatSaldo(leverancier.saldo)} />
              <DetailField label="Min. bestelling" value={String(leverancier.minBestel)} />
              <DetailField label="Type" value={leverancier.type ? "Ja" : "Nee"} />
              <DetailField label="Controle" value={leverancier.controle ? "Ja" : "Nee"} />
              <DetailField label="Opmerking" value={leverancier.opm} />
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteLeverancierDialog
        levnr={leverancier.levnr}
        naam={leverancier.naam}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/leveranciers")}
      />
    </div>
  );
}
