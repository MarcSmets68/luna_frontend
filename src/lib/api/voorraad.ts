import { request } from "./http";

export type ArtikelItem = {
  artnr: string;
  omschrijvingNl: string;
  omschrijvingFr: string;
  merk: string;
  groep: string;
  barcode: string;
  munt: string;
  btwKode: string;
  aankoopprijs: number;
  verkoopprijs: number;
  verkoopprijsIncl: number;
  voorraad: number;
  voorraadMin: number;
  voorraadMax: number;
  stock: boolean;
  geblokkeerd: boolean;
  leverancierNr: number;
  gewicht: number;
  type: string;
  datum: string | null;
};

type ArtikelenResponse = {
  items: ArtikelItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * Paged list of artikelen (products/inventory). No exact total count is
 * available - see Backend/README.md ("No exact totalCount") - so pagination
 * relies on `hasMore` rather than a page count. Pass `lageVoorraad: true` to
 * filter to the same "lage voorraad" set as the dashboard's
 * lageVoorraadCount stat (exact same rule, server-side). Pass `geblokkeerd`
 * to filter on the blocked flag server-side (`false` = only unblocked,
 * `true` = only blocked, omitted = no filter).
 * Backend: GET /web/artikel (Luna.Web.ArtikelHandler).
 */
export async function getArtikelen(
  page = 1,
  pageSize = 25,
  options: {
    lageVoorraad?: boolean;
    geblokkeerd?: boolean;
    artnr?: string;
    omschrijving?: string;
  } = {},
): Promise<ArtikelenResponse> {
  const { lageVoorraad, geblokkeerd, artnr, omschrijving } = options;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (lageVoorraad) query.set("lageVoorraad", "true");
  if (geblokkeerd !== undefined) query.set("geblokkeerd", String(geblokkeerd));
  // artnr (prefix) / omschrijving (substring) are appended with
  // encodeURIComponent instead of URLSearchParams: URLSearchParams would
  // serialize a space as "+", which OpenEdge's query-value decoder does not
  // treat as a space (same reasoning as getArtikel()/getKlanten()).
  const artnrTrimmed = artnr?.trim();
  const omschrijvingTrimmed = omschrijving?.trim();
  const artnrPart = artnrTrimmed ? `&artnr=${encodeURIComponent(artnrTrimmed)}` : "";
  const omschrijvingPart = omschrijvingTrimmed
    ? `&omschrijving=${encodeURIComponent(omschrijvingTrimmed)}`
    : "";
  return request<ArtikelenResponse>("GET", `/artikel?${query.toString()}${artnrPart}${omschrijvingPart}`);
}

/**
 * Single artikel lookup by artnr. Returns `null` when no artikel matches
 * exactly (not found/removed) instead of throwing, so callers can render a
 * not-found state.
 *
 * Deliberately goes through the paged list endpoint (GET /web/artikel?artnr=...,
 * an existing exact-BEGINS filter) instead of GET /web/artikel/{artnr} with
 * the artnr embedded in the URL path: artnr values may contain a literal "%"
 * (e.g. "100%.511131COWW"), and PASOE's underlying Tomcat connector rejects
 * such path segments outright with a generic 400 - a raw "%" left over after
 * one decode pass of the URL-encoded path looks like a double-encoding
 * evasion attempt and never even reaches our WebHandler code. Query-string
 * values aren't subject to that same path-normalization check.
 * Backend: GET /web/artikel (Luna.Web.ArtikelHandler).
 */
export async function getArtikel(artnr: string): Promise<ArtikelItem | null> {
  const target = artnr.trim();

  // Deliberately built with encodeURIComponent rather than URLSearchParams:
  // URLSearchParams serializes spaces as "+" (the legacy form-urlencoded
  // convention), but an embedded space in an artnr needs to reach the
  // backend as "%20" - OpenEdge's query-value decoder does not treat "+" as
  // a space, so a "+" would silently fail to match the real row.
  const query = `artnr=${encodeURIComponent(target)}&pageSize=5`;

  const data = await request<ArtikelenResponse>("GET", `/artikel?${query}`);
  const match = data.items.find(
    (item) => item.artnr.toUpperCase() === target.toUpperCase(),
  );
  return match ?? null;
}
