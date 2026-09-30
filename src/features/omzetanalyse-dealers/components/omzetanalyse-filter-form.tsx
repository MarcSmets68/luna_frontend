"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SoortItem } from "@/lib/api-client";
import { KlantLookup, type KlantSelectie } from "./klant-lookup";

const ALLE = "__alle__";
export const REPORT_PATH = "/rapportage/omzetanalyse-dealers";

export type OmzetanalyseFilterValues = {
  datumVan: string;
  datumTot: string;
  klnr: number | null;
  klantNaam: string | null;
  soort: string;
  perDealer: boolean;
};

/** Builds the report URL; empty/default params are omitted. */
export function buildReportUrl(v: OmzetanalyseFilterValues): string {
  const q = new URLSearchParams();
  if (v.datumVan) q.set("datumVan", v.datumVan);
  if (v.datumTot) q.set("datumTot", v.datumTot);
  if (v.klnr !== null) q.set("klnr", String(v.klnr));
  if (v.soort) q.set("soort", v.soort);
  if (v.soort && v.perDealer) q.set("perDealer", "true");
  q.set("uitvoeren", "1");
  return `${REPORT_PATH}?${q.toString()}`;
}

export function OmzetanalyseFilterForm({
  soorten,
  initial,
}: {
  soorten: SoortItem[];
  initial: OmzetanalyseFilterValues;
}) {
  const router = useRouter();
  const [datumVan, setDatumVan] = useState(initial.datumVan);
  const [datumTot, setDatumTot] = useState(initial.datumTot);
  const [klant, setKlant] = useState<KlantSelectie | null>(
    initial.klnr !== null ? { klnr: initial.klnr, naam: initial.klantNaam } : null
  );
  const [soort, setSoort] = useState(initial.soort);
  const [perDealer, setPerDealer] = useState(initial.soort ? initial.perDealer : false);
  const [error, setError] = useState<string | null>(null);

  const selectItems = [
    { value: ALLE, label: "Alle soorten" },
    ...soorten.map((s) => ({ value: s.kode, label: `${s.kode} \u2013 ${s.omschr}` })),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (datumVan && datumTot && datumVan > datumTot) {
      setError("Datum van mag niet na datum tot liggen");
      return;
    }
    setError(null);
    router.push(
      buildReportUrl({
        datumVan,
        datumTot,
        klnr: klant?.klnr ?? null,
        klantNaam: klant?.naam ?? null,
        soort,
        perDealer,
      })
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="datumVan" className="text-sm font-medium">
          Datum van
        </label>
        <Input id="datumVan" type="date" value={datumVan} onChange={(e) => setDatumVan(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="datumTot" className="text-sm font-medium">
          Datum tot
        </label>
        <Input id="datumTot" type="date" value={datumTot} onChange={(e) => setDatumTot(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Klant</span>
        <KlantLookup value={klant} onChange={setKlant} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span id="soort-label" className="text-sm font-medium">
          Soort
        </span>
        <Select
          items={selectItems}
          value={soort || ALLE}
          onValueChange={(v) => {
            const next = !v || v === ALLE ? "" : (v as string);
            setSoort(next);
            if (!next) setPerDealer(false);
          }}
        >
          <SelectTrigger aria-labelledby="soort-label" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 md:col-span-2">
        <Checkbox
          id="perDealer"
          checked={perDealer}
          disabled={!soort}
          onCheckedChange={(c) => setPerDealer(c === true)}
        />
        <label htmlFor="perDealer" className="text-sm">
          Afzonderlijke lijst per dealer
        </label>
      </div>

      <div className="flex items-center gap-3 md:col-span-2 lg:justify-end">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit">Toon rapport</Button>
      </div>
    </form>
  );
}
