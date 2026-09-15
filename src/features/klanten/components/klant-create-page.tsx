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
import { createKlant, type CreateKlantPayload } from "@/lib/api-client";

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

type KlantCreateFormState = {
  klnr: string;
  naam: string;
  naam1: string;
  contact: string;
  adres: string;
  postnr: string;
  stad: string;
  land: string;
  tel: string;
  fax: string;
  gsm: string;
  email: string;
  taal: string;
  munt: string;
  btwNr: string;
  saldo: string;
  geblokkeerd: boolean;
  opm: string;
};

const EMPTY_FORM: KlantCreateFormState = {
  klnr: "",
  naam: "",
  naam1: "",
  contact: "",
  adres: "",
  postnr: "",
  stad: "",
  land: "",
  tel: "",
  fax: "",
  gsm: "",
  email: "",
  taal: "",
  munt: "",
  btwNr: "",
  saldo: "",
  geblokkeerd: false,
  opm: "",
};

export function KlantCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<KlantCreateFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof KlantCreateFormState>(key: K, value: KlantCreateFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    const klnr = Number(form.klnr);
    if (!form.klnr.trim() || !Number.isInteger(klnr) || klnr <= 0) {
      setError("Klantnr moet een geldig positief getal zijn.");
      return;
    }

    const saldo = form.saldo.trim() ? Number(form.saldo) : 0;
    if (Number.isNaN(saldo)) {
      setError("Saldo moet een geldig getal zijn.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CreateKlantPayload = {
        klnr,
        naam: form.naam,
        naam1: form.naam1,
        contact: form.contact,
        adres: form.adres,
        postnr: form.postnr,
        stad: form.stad,
        land: form.land,
        tel: form.tel,
        fax: form.fax,
        gsm: form.gsm,
        email: form.email,
        taal: form.taal,
        munt: form.munt,
        btwNr: form.btwNr,
        saldo,
        geblokkeerd: form.geblokkeerd,
        opm: form.opm,
      };
      await createKlant(payload);
      router.push(`/klanten/${klnr}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het aanmaken van de klant.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href="/klanten"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Klanten
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Nieuwe klant</h1>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <EditField
              label="Klantnr"
              value={form.klnr}
              onChange={(v) => setField("klnr", v)}
              type="number"
            />
            <EditField label="Naam" value={form.naam} onChange={(v) => setField("naam", v)} />
            <EditField label="Naam 1" value={form.naam1} onChange={(v) => setField("naam1", v)} />
            <EditField
              label="Contact"
              value={form.contact}
              onChange={(v) => setField("contact", v)}
            />
            <EditField label="Adres" value={form.adres} onChange={(v) => setField("adres", v)} />
            <EditField
              label="Postnr"
              value={form.postnr}
              onChange={(v) => setField("postnr", v)}
            />
            <EditField label="Stad" value={form.stad} onChange={(v) => setField("stad", v)} />
            <EditField label="Land" value={form.land} onChange={(v) => setField("land", v)} />
            <EditField label="Telefoon" value={form.tel} onChange={(v) => setField("tel", v)} />
            <EditField label="Fax" value={form.fax} onChange={(v) => setField("fax", v)} />
            <EditField label="GSM" value={form.gsm} onChange={(v) => setField("gsm", v)} />
            <EditField
              label="E-mail"
              value={form.email}
              onChange={(v) => setField("email", v)}
              type="email"
            />
            <EditField label="Taal" value={form.taal} onChange={(v) => setField("taal", v)} />
            <EditField label="Munt" value={form.munt} onChange={(v) => setField("munt", v)} />
            <EditField label="BTW-nr" value={form.btwNr} onChange={(v) => setField("btwNr", v)} />
            <EditField
              label="Saldo"
              value={form.saldo}
              onChange={(v) => setField("saldo", v)}
              type="number"
            />
            <div>
              <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Geblokkeerd
              </div>
              <label className="mt-1 flex h-8 items-center gap-2">
                <Checkbox
                  checked={form.geblokkeerd}
                  onCheckedChange={() => setField("geblokkeerd", !form.geblokkeerd)}
                  aria-label="Geblokkeerd"
                />
                <span className="text-sm text-foreground">{form.geblokkeerd ? "Ja" : "Nee"}</span>
              </label>
            </div>
            <EditField label="Opmerking" value={form.opm} onChange={(v) => setField("opm", v)} />
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/klanten")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Bezig..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
