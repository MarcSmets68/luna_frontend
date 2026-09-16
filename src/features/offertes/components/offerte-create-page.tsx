"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { createOfferte, createOfflijn, type CreateOffertePayload, type KlantItem } from "@/lib/api-client";
import { OfferteLijnenEditor, type LocalLijn } from "./offerte-lijnen-editor";

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

type OfferteCreateFormState = {
  datum: string;
  naam: string;
  adres: string;
  postnr: string;
  stad: string;
  munt: string;
  offgroep: string;
  soort: string;
  verkoopkans: string;
  uRef: string;
  besteldatum: string;
  verkochtdatum: string;
  opm: string;
  passief: boolean;
  verloren: boolean;
  verkocht: boolean;
};

function initialFormState(klant: KlantItem): OfferteCreateFormState {
  return {
    datum: new Date().toISOString().slice(0, 10),
    naam: klant.naam,
    adres: klant.adres,
    postnr: klant.postnr,
    stad: klant.stad,
    munt: klant.munt,
    offgroep: "",
    soort: "",
    verkoopkans: "",
    uRef: "",
    besteldatum: "",
    verkochtdatum: "",
    opm: "",
    passief: false,
    verloren: false,
    verkocht: false,
  };
}

export function OfferteCreatePage({ klant }: { klant: KlantItem }) {
  const router = useRouter();
  const [form, setForm] = useState<OfferteCreateFormState>(() => initialFormState(klant));
  const [lijnen, setLijnen] = useState<LocalLijn[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof OfferteCreateFormState>(
    key: K,
    value: OfferteCreateFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const bedrag = useMemo(
    () =>
      lijnen
        .filter((lijn) => !lijn.subtotaal && !lijn.kolomtitel && !lijn.infolijn)
        .reduce((sum, lijn) => sum + lijn.bedrag, 0),
    [lijnen]
  );

  async function handleSave() {
    if (!form.datum.trim()) {
      setError("Datum is verplicht.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CreateOffertePayload = {
        klnr: klant.klnr,
        datum: form.datum,
        naam: form.naam,
        adres: form.adres,
        postnr: form.postnr,
        stad: form.stad,
        munt: form.munt,
        offgroep: form.offgroep,
        soort: form.soort,
        verkoopkans: Number(form.verkoopkans) || 0,
        uRef: form.uRef,
        besteldatum: form.besteldatum || undefined,
        verkochtdatum: form.verkochtdatum || undefined,
        opm: form.opm,
        passief: form.passief,
        verloren: form.verloren,
        verkocht: form.verkocht,
        bedrag,
        btw: 0,
      };
      const created = await createOfferte(payload);

      const failed: { omschrijving: string; error: string }[] = [];
      for (const lijn of lijnen) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to strip clientId from the payload
        const { clientId, ...rest } = lijn;
        try {
          await createOfflijn(created.offnr, created.versie, rest);
        } catch (e) {
          failed.push({
            omschrijving: lijn.omschrijvingOfferte || lijn.omschrijving || lijn.artnr,
            error: e instanceof Error ? e.message : "Onbekende fout",
          });
        }
      }

      if (failed.length > 0) {
        sessionStorage.setItem(
          `luna:offerte-lijn-fout:${created.offnr}:${created.versie}`,
          JSON.stringify({ failed })
        );
        router.push(`/offertes/${created.offnr}/${created.versie}?lijnFout=1`);
      } else {
        router.push(`/offertes/${created.offnr}/${created.versie}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het aanmaken van de offerte.");
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href={`/klanten/${klant.klnr}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Offertes
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Nieuwe offerte</h1>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Klantnr
              </div>
              <div className="mt-1 text-sm text-foreground">{klant.klnr}</div>
            </div>
            <EditField
              label="Datum"
              value={form.datum}
              onChange={(v) => setField("datum", v)}
              type="date"
            />
            <EditField label="Naam" value={form.naam} onChange={(v) => setField("naam", v)} />
            <EditField label="Adres" value={form.adres} onChange={(v) => setField("adres", v)} />
            <EditField label="Postnr" value={form.postnr} onChange={(v) => setField("postnr", v)} />
            <EditField label="Stad" value={form.stad} onChange={(v) => setField("stad", v)} />
            <EditField label="Munt" value={form.munt} onChange={(v) => setField("munt", v)} />
            <EditField
              label="Offertegroep"
              value={form.offgroep}
              onChange={(v) => setField("offgroep", v)}
            />
            <EditField label="Soort" value={form.soort} onChange={(v) => setField("soort", v)} />
            <EditField
              label="Verkoopkans"
              value={form.verkoopkans}
              onChange={(v) => setField("verkoopkans", v)}
              type="number"
            />
            <EditField label="Uw referentie" value={form.uRef} onChange={(v) => setField("uRef", v)} />
            <EditField
              label="Besteldatum"
              value={form.besteldatum}
              onChange={(v) => setField("besteldatum", v)}
              type="date"
            />
            <EditField
              label="Verkoopdatum"
              value={form.verkochtdatum}
              onChange={(v) => setField("verkochtdatum", v)}
              type="date"
            />
            <EditField label="Opmerking" value={form.opm} onChange={(v) => setField("opm", v)} />
            <div>
              <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Passief
              </div>
              <label className="mt-1 flex h-8 items-center gap-2">
                <Checkbox
                  checked={form.passief}
                  onCheckedChange={() => setField("passief", !form.passief)}
                  aria-label="Passief"
                />
                <span className="text-sm text-foreground">{form.passief ? "Ja" : "Nee"}</span>
              </label>
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Verloren
              </div>
              <label className="mt-1 flex h-8 items-center gap-2">
                <Checkbox
                  checked={form.verloren}
                  onCheckedChange={() => setField("verloren", !form.verloren)}
                  aria-label="Verloren"
                />
                <span className="text-sm text-foreground">{form.verloren ? "Ja" : "Nee"}</span>
              </label>
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Verkocht
              </div>
              <label className="mt-1 flex h-8 items-center gap-2">
                <Checkbox
                  checked={form.verkocht}
                  onCheckedChange={() => setField("verkocht", !form.verkocht)}
                  aria-label="Verkocht"
                />
                <span className="text-sm text-foreground">{form.verkocht ? "Ja" : "Nee"}</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-[16px] font-semibold text-foreground">Lijnen</h2>
      <Card className="mb-6">
        <CardContent>
          <OfferteLijnenEditor mode="local" lijnen={lijnen} onChange={setLijnen} />
        </CardContent>
      </Card>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/klanten/${klant.klnr}`)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Bezig..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
