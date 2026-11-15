// Pure helpers for the Verkoopsanalyse report: URL state, growth, totals and
// month labels. No React, no API calls - easy to unit test.

import type { VerkoopMaand, VerkoopsanalyseResponse, VerkoopsanalyseRij } from "@/lib/api-client";

// ---------------------------------------------------------------- URL state

export type VerkoopsanalyseSelectie = {
  klnrs: number[];
  /** Exact artnrs; a trailing "*" marks a "begint met" artikelgroep. */
  artikelen: string[];
};

export type VerkoopsanalyseSearchParams = {
  dealers?: string;
  artikelen?: string;
  toon?: string;
};

/** Parses `?dealers=12,34&artikelen=A|B*` into a clean, de-duplicated selection. */
export function parseSelectie(sp: VerkoopsanalyseSearchParams): VerkoopsanalyseSelectie {
  const klnrs = [
    ...new Set(
      (sp.dealers ?? "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ];
  const seen = new Set<string>();
  const artikelen: string[] = [];
  for (const raw of (sp.artikelen ?? "").split("|")) {
    const value = raw.trim();
    if (!value || value === "*") continue;
    const key = value.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    artikelen.push(value);
  }
  return { klnrs, artikelen };
}

/** Inverse of parseSelectie; `toon=1` marks that the analysis was requested. */
export function buildSelectieQuery(selectie: VerkoopsanalyseSelectie): string {
  const query = new URLSearchParams();
  if (selectie.klnrs.length > 0) query.set("dealers", selectie.klnrs.join(","));
  if (selectie.artikelen.length > 0) query.set("artikelen", selectie.artikelen.join("|"));
  query.set("toon", "1");
  return query.toString();
}

export function isGroep(artikel: string): boolean {
  return artikel.endsWith("*");
}

// ---------------------------------------------------------------- numbers

/**
 * Growth in percent versus the previous year. `null` when there is nothing
 * to compare with (previous value 0): "+∞ %" helps nobody.
 */
export function groei(huidig: number, vorig: number): number | null {
  if (!vorig) return null;
  return ((huidig - vorig) / Math.abs(vorig)) * 100;
}

export type JaarTotaal = {
  omzet: number;
  omzetVorigJaar: number;
  aantal: number;
  aantalVorigJaar: number;
};

export function sommeer(maanden: VerkoopMaand[]): JaarTotaal {
  return maanden.reduce<JaarTotaal>(
    (acc, m) => ({
      omzet: acc.omzet + m.omzet,
      omzetVorigJaar: acc.omzetVorigJaar + m.omzetVorigJaar,
      aantal: acc.aantal + m.aantal,
      aantalVorigJaar: acc.aantalVorigJaar + m.aantalVorigJaar,
    }),
    { omzet: 0, omzetVorigJaar: 0, aantal: 0, aantalVorigJaar: 0 },
  );
}

/**
 * Summing aantallen only makes sense when every row counts in the same unit
 * (meters and stuks do not add up). The total aantal is hidden when mixed.
 */
export function heeftGemengdeEenheden(rijen: VerkoopsanalyseRij[]): boolean {
  return new Set(rijen.map((r) => r.eenheid ?? "")).size > 1;
}

// ---------------------------------------------------------------- labels

const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

/** "2026-03" -> "mrt 2026"; anything unparsable is returned as-is. */
export function maandLabel(maand: string): string {
  const [y, m] = maand.split("-");
  const index = Number(m) - 1;
  if (!y || !(index >= 0 && index < 12)) return maand;
  return `${MAANDEN[index]} ${y}`;
}

/** "2026-03" -> "mrt 2025" (the comparison month). */
export function vorigJaarLabel(maand: string): string {
  const [y, m] = maand.split("-");
  const year = Number(y);
  if (!Number.isInteger(year)) return maand;
  return maandLabel(`${year - 1}-${m}`);
}

/** Display name of a row: artnr (+ "…" for a group) and the omschrijving. */
export function rijLabel(rij: Pick<VerkoopsanalyseRij, "artnr" | "swBegins">): string {
  return rij.swBegins ? `${rij.artnr}… (groep)` : rij.artnr;
}

export function dealersLabel(response: Pick<VerkoopsanalyseResponse, "dealers">, gekozen: number): string {
  if (gekozen === 0) return `Alle Nomaled-dealers (${response.dealers.length})`;
  if (response.dealers.length === 1) return response.dealers[0].naam;
  return `${response.dealers.length} dealers`;
}
