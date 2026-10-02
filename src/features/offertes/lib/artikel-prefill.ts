import type { LineFields } from "../components/offerte-lijnen-editor";
import type { ArtikelLookupItem } from "./actions";

/**
 * Fields copied onto an offerte line when an artikel is picked in the lookup.
 * Deliberately limited to these five - btwKode, bedrag, aantal, teLeveren,
 * korting, bruto(-verkoopprijs) and the flags are never touched.
 */
export function artikelPrefillPatch(item: ArtikelLookupItem): Partial<LineFields> {
  const omschrijving = item.omschrijvingNl || item.omschrijvingFr;
  return {
    artnr: item.artnr,
    omschrijving,
    omschrijvingOfferte: omschrijving,
    verkoopprijs: item.verkoopprijs,
    aankoopprijs: item.aankoopprijs,
  };
}
