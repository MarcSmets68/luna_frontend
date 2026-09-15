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
import { createBon, createBonLijn, type CreateBonPayload, type KlantItem } from "@/lib/api-client";
import { OrderLijnenEditor, type LocalLijn } from "./order-lijnen-editor";

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

type OrderCreateFormState = {
  datum: string;
  naam: string;
  adres: string;
  postnr: string;
  stad: string;
  munt: string;
  uRef: string;
  besteldatum: string;
  levDatum: string;
  opm: string;
  geparkeerd: boolean;
  verzonden: boolean;
};

function initialFormState(klant: KlantItem): OrderCreateFormState {
  return {
    datum: new Date().toISOString().slice(0, 10),
    naam: klant.naam,
    adres: klant.adres,
    postnr: klant.postnr,
    stad: klant.stad,
    munt: klant.munt,
    uRef: "",
    besteldatum: "",
    levDatum: "",
    opm: "",
    geparkeerd: false,
    verzonden: false,
  };
}

export function OrderCreatePage({ klant }: { klant: KlantItem }) {
  const router = useRouter();
  const [form, setForm] = useState<OrderCreateFormState>(() => initialFormState(klant));
  const [lijnen, setLijnen] = useState<LocalLijn[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof OrderCreateFormState>(
    key: K,
    value: OrderCreateFormState[K]
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
      const payload: CreateBonPayload = {
        klnr: klant.klnr,
        type: "ORDERBEVESTIGING",
        datum: form.datum,
        naam: form.naam,
        adres: form.adres,
        postnr: form.postnr,
        stad: form.stad,
        munt: form.munt,
        uRef: form.uRef,
        besteldatum: form.besteldatum || undefined,
        levDatum: form.levDatum || undefined,
        opm: form.opm,
        geparkeerd: form.geparkeerd,
        verzonden: form.verzonden,
        bedrag,
        btw: 0,
      };
      const created = await createBon(payload);

      const failed: { omschrijving: string; error: string }[] = [];
      for (const lijn of lijnen) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to strip clientId from the payload
        const { clientId, ...rest } = lijn;
        try {
          await createBonLijn(created.bonnr, rest);
        } catch (e) {
          failed.push({
            omschrijving: lijn.omschrijving || lijn.artnr,
            error: e instanceof Error ? e.message : "Onbekende fout",
          });
        }
      }

      if (failed.length > 0) {
        sessionStorage.setItem(
          `luna:bon-lijn-fout:${created.bonnr}`,
          JSON.stringify({ failed })
        );
        router.push(`/orders/${created.bonnr}?lijnFout=1`);
      } else {
        router.push(`/orders/${created.bonnr}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis bij het aanmaken van de order.");
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
        Orders
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Nieuwe order</h1>
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
            <EditField label="Uw referentie" value={form.uRef} onChange={(v) => setField("uRef", v)} />
            <EditField
              label="Besteldatum"
              value={form.besteldatum}
              onChange={(v) => setField("besteldatum", v)}
              type="date"
            />
            <EditField
              label="Leverdatum"
              value={form.levDatum}
              onChange={(v) => setField("levDatum", v)}
              type="date"
            />
            <EditField label="Opmerking" value={form.opm} onChange={(v) => setField("opm", v)} />
            <div>
              <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Geparkeerd
              </div>
              <label className="mt-1 flex h-8 items-center gap-2">
                <Checkbox
                  checked={form.geparkeerd}
                  onCheckedChange={() => setField("geparkeerd", !form.geparkeerd)}
                  aria-label="Geparkeerd"
                />
                <span className="text-sm text-foreground">{form.geparkeerd ? "Ja" : "Nee"}</span>
              </label>
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                Verzonden
              </div>
              <label className="mt-1 flex h-8 items-center gap-2">
                <Checkbox
                  checked={form.verzonden}
                  onCheckedChange={() => setField("verzonden", !form.verzonden)}
                  aria-label="Verzonden"
                />
                <span className="text-sm text-foreground">{form.verzonden ? "Ja" : "Nee"}</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-[16px] font-semibold text-foreground">Lijnen</h2>
      <Card className="mb-6">
        <CardContent>
          <OrderLijnenEditor lijnen={lijnen} onChange={setLijnen} />
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
