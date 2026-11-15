"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DealerPicker } from "@/features/omzetanalyse-dealers/components/dashboard/dealer-picker";
import { ArtikelLookupDropdown } from "@/features/offertes/components/artikel-lookup-dropdown";
import type { ArtikelLookupItem } from "@/features/offertes/lib/actions";
import { buildSelectieQuery, isGroep, type VerkoopsanalyseSelectie } from "../lib/verkoopsanalyse-model";

export type DealerOptie = { klnr: number; naam: string };

const MIN_GROEP_CHARS = 2;

/**
 * Selection form: dealers (multi-select, empty = all Nomaled dealers) and
 * articles - single articles via the artikel lookup, or an artikelgroep as
 * "artnr begint met ..." (stored with a trailing "*"). Submitting writes the
 * selection to the URL, so a report can be bookmarked or shared.
 */
export function VerkoopsanalyseFilters({
  dealers,
  dealersFout,
  initial,
}: {
  dealers: DealerOptie[];
  dealersFout: boolean;
  initial: VerkoopsanalyseSelectie;
}) {
  const router = useRouter();
  const [klnrs, setKlnrs] = useState<Set<number>>(() => new Set(initial.klnrs));
  const [artikelen, setArtikelen] = useState<string[]>(initial.artikelen);
  const [term, setTerm] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);

  const voegToe = useCallback((value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setArtikelen((prev) =>
      prev.some((a) => a.toUpperCase() === clean.toUpperCase()) ? prev : [...prev, clean],
    );
    setTerm("");
    setLookupOpen(false);
  }, []);

  const onSelect = useCallback((item: ArtikelLookupItem) => voegToe(item.artnr), [voegToe]);
  const onClose = useCallback(() => setLookupOpen(false), []);

  const groepTerm = term.trim().replace(/\*+$/, "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`?${buildSelectieQuery({ klnrs: [...klnrs], artikelen })}`);
  }

  return (
    <form onSubmit={submit} className="mb-6 space-y-4 border border-border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-muted-foreground">Dealers</div>
          {dealersFout ? (
            <p role="alert" className="text-[13px] text-destructive">
              De dealerlijst kon niet geladen worden.
            </p>
          ) : (
            <DealerPicker dealers={dealers} selected={klnrs} onChange={setKlnrs} />
          )}
          <p className="mt-1.5 text-[12px] text-muted-foreground">Niets gekozen = alle Nomaled-dealers.</p>
        </div>

        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-muted-foreground">Artikelen of groepen</div>
          <div className="flex flex-wrap items-start gap-2">
            <div className="relative w-full max-w-80">
              <Input
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setLookupOpen(true);
                }}
                onFocus={() => setLookupOpen(true)}
                onBlur={() => setLookupOpen(false)}
                onKeyDown={(e) => {
                  // Enter in the search field must not submit the whole form.
                  if (e.key === "Enter") e.preventDefault();
                }}
                placeholder="Zoek op artnr of omschrijving"
                aria-label="Zoek een artikel"
                className="h-8 text-[13px]"
              />
              <ArtikelLookupDropdown term={term} open={lookupOpen} onSelect={onSelect} onClose={onClose} />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={groepTerm.length < MIN_GROEP_CHARS}
              onClick={() => voegToe(`${groepTerm}*`)}
              title="Alle artikelen waarvan het artnr met deze tekst begint"
            >
              <Layers />
              {groepTerm.length >= MIN_GROEP_CHARS ? `Groep "${groepTerm}…"` : "Als groep"}
            </Button>
          </div>

          {artikelen.length === 0 ? (
            <p className="mt-1.5 text-[12px] text-muted-foreground">Niets gekozen = alle artikelen samen.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Gekozen artikelen">
              {artikelen.map((a) => (
                <li
                  key={a}
                  className="inline-flex items-center gap-1 border border-border bg-muted/50 py-0.5 pr-1 pl-2 text-[12px]"
                >
                  {isGroep(a) ? (
                    <span>
                      <span className="text-muted-foreground">begint met </span>
                      {a.slice(0, -1)}
                    </span>
                  ) : (
                    <span>{a}</span>
                  )}
                  <button
                    type="button"
                    aria-label={`Verwijder ${a}`}
                    className="p-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setArtikelen((prev) => prev.filter((x) => x !== a))}
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Analyse maken
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setKlnrs(new Set());
            setArtikelen([]);
            setTerm("");
          }}
        >
          Selectie wissen
        </Button>
      </div>
    </form>
  );
}
