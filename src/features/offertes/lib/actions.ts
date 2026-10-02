"use server";

import { getArtikelen } from "@/lib/api-client";

export type ArtikelLookupItem = {
  artnr: string;
  omschrijvingNl: string;
  omschrijvingFr: string;
  verkoopprijs: number;
  aankoopprijs: number;
};

const MIN_ARTNR_CHARS = 2;
// The omschrijving leg is an unindexed substring scan server-side, so it is
// gated behind a longer minimum than the indexed artnr-prefix leg.
const MIN_OMSCHRIJVING_CHARS = 3;
const LEG_PAGE_SIZE = 10;
const MAX_ITEMS = 15;

/**
 * Server action wrapping the artikel search for the offerte-lijn lookup.
 * Always excludes blocked articles. Errors from the API client propagate to
 * the caller (the dropdown renders "Zoeken mislukt").
 */
export async function zoekArtikelenAction(
  term: string
): Promise<{ items: ArtikelLookupItem[]; truncated: boolean }> {
  const trimmed = term.trim();
  if (trimmed.length < MIN_ARTNR_CHARS) return { items: [], truncated: false };

  const [byArtnr, byOmschrijving] = await Promise.all([
    getArtikelen(1, LEG_PAGE_SIZE, { geblokkeerd: false, artnr: trimmed }),
    trimmed.length >= MIN_OMSCHRIJVING_CHARS
      ? getArtikelen(1, LEG_PAGE_SIZE, { geblokkeerd: false, omschrijving: trimmed })
      : Promise.resolve(null),
  ]);

  const seen = new Set<string>();
  const merged: ArtikelLookupItem[] = [];
  for (const a of [...byArtnr.items, ...(byOmschrijving?.items ?? [])]) {
    const key = a.artnr.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      artnr: a.artnr,
      omschrijvingNl: a.omschrijvingNl,
      omschrijvingFr: a.omschrijvingFr,
      verkoopprijs: a.verkoopprijs,
      aankoopprijs: a.aankoopprijs,
    });
  }

  const cutOff = merged.length > MAX_ITEMS;
  return {
    items: merged.slice(0, MAX_ITEMS),
    truncated: byArtnr.hasMore || (byOmschrijving?.hasMore ?? false) || cutOff,
  };
}
