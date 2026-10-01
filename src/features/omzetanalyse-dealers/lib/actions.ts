"use server";

import { getKlanten } from "@/lib/api-client";

export type KlantZoekResultaat = { klnr: number; naam: string };

/** Server action wrapping the existing klanten search for the klant lookup. */
export async function zoekKlantenAction(naam: string): Promise<KlantZoekResultaat[]> {
  const term = naam.trim();
  if (!term) return [];
  const { items } = await getKlanten({ naam: term, pageSize: 10 });
  return items.map((k) => ({ klnr: k.klnr, naam: k.naam }));
}
