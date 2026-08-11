// Single typed client for all PASOE WebHandler calls - components must not
// call fetch() directly (see root AGENTS.md, frontend constraints).

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/web";

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request to ${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type LakproductieItem = {
  bonnr: number;
  klant: string;
  artnr: string;
  omschrijving: string;
  aantal: number;
  behandeling: string;
  techniek: string;
  kleursoort: string;
  kleurkode: string;
  afwerking: string;
  groepeerKleur: string;
  orderdatum: string | null;
  leverdatum: string | null;
};

type LakproductieResponse = {
  items: LakproductieItem[];
};

/**
 * Open klantorderregels die nog gelakt/geanodiseerd moeten worden en nog
 * niet besteld zijn bij de externe verwerker.
 * Backend: GET /web/lakproduktie (Luna.Web.LakproductieHandler).
 */
export async function getLakproductieItems(): Promise<LakproductieItem[]> {
  const data = await apiGet<LakproductieResponse>("/lakproduktie");
  return data.items;
}

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
 * relies on `hasMore` rather than a page count.
 * Backend: GET /web/artikel (Luna.Web.ArtikelHandler).
 */
export async function getArtikelen(page = 1, pageSize = 25): Promise<ArtikelenResponse> {
  return apiGet<ArtikelenResponse>(`/artikel?page=${page}&pageSize=${pageSize}`);
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

  const data = await apiGet<ArtikelenResponse>(`/artikel?${query}`);
  const match = data.items.find((item) => item.artnr.toUpperCase() === target.toUpperCase());
  return match ?? null;
}

export type KlantItem = {
  klnr: number;
  naam: string;
  naam1: string;
  contact: string;
  adres: string;
  postnr: string;
  stad: string;
  land: string;
  tel: string;
  fax: string;
  gsm: string;
  email: string;
  taal: string;
  munt: string;
  btwNr: string;
  saldo: number;
  geblokkeerd: boolean;
  opm: string;
};

type KlantenResponse = {
  items: KlantItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * Paged list of klanten (customers). No exact total count is available
 * (same reasoning as getArtikelen) - see Backend/README.md - so pagination
 * relies on `hasMore` rather than a page count.
 * Backend: GET /web/klant (Luna.Web.KlantHandler).
 */
export async function getKlanten(page = 1, pageSize = 25): Promise<KlantenResponse> {
  return apiGet<KlantenResponse>(`/klant?page=${page}&pageSize=${pageSize}`);
}

export type OfferteItem = {
  offnr: number;
  versie: number;
  datum: string | null;
  klnr: number;
  naam: string;
  adres: string;
  postnr: string;
  stad: string;
  munt: string;
  bedrag: number;
  btw: number;
  offgroep: string;
  soort: string;
  passief: boolean;
  verloren: boolean;
  verkocht: boolean;
  verkoopkans: number;
  uRef: string;
  besteldatum: string | null;
  verkochtdatum: string | null;
  opm: string;
};

type OffertenResponse = {
  items: OfferteItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * Paged list of offertes (quotes), newest offnr/versie first. No exact total
 * count is available (same reasoning as getArtikelen) - see
 * Backend/README.md - so pagination relies on `hasMore` rather than a page
 * count. Each row is one offerte revision (offnr + versie); this does not
 * dedupe to "latest versie per offnr". Pass `klnr` to filter to a single
 * customer's offertes.
 * Backend: GET /web/offerte (Luna.Web.OfferteHandler, read-only for now).
 */
export async function getOffertes(
  params: { klnr?: number; page?: number; pageSize?: number } = {}
): Promise<OffertenResponse> {
  const { klnr, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (klnr !== undefined) query.set("klnr", String(klnr));
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return apiGet<OffertenResponse>(`/offerte?${query.toString()}`);
}

export type BonItem = {
  bonnr: number;
  type: string;
  stempel: string;
  datum: string | null;
  klnr: number;
  naam: string;
  adres: string;
  postnr: string;
  stad: string;
  munt: string;
  bedrag: number;
  btw: number;
  uRef: string;
  besteldatum: string | null;
  levDatum: string | null;
  geparkeerd: boolean;
  verzonden: boolean;
  opm: string;
};

type BonnenResponse = {
  items: BonItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * Paged list of bonnen (orders/order confirmations etc.). No exact total
 * count is available (same reasoning as getArtikelen) - so pagination
 * relies on `hasMore` rather than a page count. Filter by `klnr` and/or
 * `type` (e.g. "ORDERBEVESTIGING").
 * Backend: GET /web/bon (Luna.Web.BonHandler, read-only).
 */
export async function getBonnen(
  params: { klnr?: number; type?: string; page?: number; pageSize?: number } = {}
): Promise<BonnenResponse> {
  const { klnr, type, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (klnr !== undefined) query.set("klnr", String(klnr));
  if (type !== undefined) query.set("type", type);
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return apiGet<BonnenResponse>(`/bon?${query.toString()}`);
}

/**
 * Single klant lookup by klnr. Returns `null` when the backend responds
 * with 404 (klant not found/removed) instead of throwing, so callers can
 * render a not-found state. Any other non-OK status still throws, mirroring
 * `apiGet`'s error format.
 * Backend: GET /web/klant/{klnr} (Luna.Web.KlantHandler).
 */
export async function getKlant(klnr: number): Promise<KlantItem | null> {
  const path = `/klant/${klnr}`;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`API request to ${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<KlantItem>;
}
