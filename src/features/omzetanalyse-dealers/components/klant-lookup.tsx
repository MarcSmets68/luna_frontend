"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zoekKlantenAction, type KlantZoekResultaat } from "../lib/actions";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export type KlantSelectie = { klnr: number; naam: string | null };

export function KlantLookup({
  value,
  onChange,
}: {
  value: KlantSelectie | null;
  onChange: (klant: KlantSelectie | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<KlantZoekResultaat[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < MIN_CHARS) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await zoekKlantenAction(trimmed);
        if (!cancelled) {
          setResults(found);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Zoeken mislukt");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const active = term.trim().length >= MIN_CHARS;

  if (value) {
    return (
      <div className="flex h-8 items-center justify-between gap-2 rounded-lg border border-input px-2.5 text-sm">
        <span>
          {value.klnr}
          {value.naam ? ` \u2013 ${value.naam}` : ""}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Klant wissen"
          onClick={() => onChange(null)}
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        type="text"
        value={term}
        placeholder="Zoek klant op naam..."
        aria-label="Klant zoeken"
        onChange={(e) => setTerm(e.target.value)}
      />
      {active && (results.length > 0 || searching || error) && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {searching && <li className="px-2.5 py-1.5 text-muted-foreground">Zoeken...</li>}
          {error && <li className="px-2.5 py-1.5 text-destructive">{error}</li>}
          {results.map((k) => (
            <li key={k.klnr} role="option" aria-selected={false}>
              <button
                type="button"
                className="w-full px-2.5 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange({ klnr: k.klnr, naam: k.naam });
                  setTerm("");
                  setResults([]);
                }}
              >
                {k.klnr} {"\u2013"} {k.naam}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
