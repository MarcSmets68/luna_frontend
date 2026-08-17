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

export type LakproductieBron = "lopende-orders" | "lopende-productielijnen" | "min-max-voorraad";

export type LakproductieStatus =
  | "Gereserveerd"
  | "Deels gereserveerd"
  | "Besteld"
  | "Nog te bestellen";

/**
 * Every field is always present; fields that don't apply to a given `bron`
 * are `null` (not omitted) - see Backend contract for GET /web/lakproduktie.
 * `bonnr`/`klant`/`status`/... are only populated for `bron` "lopende-orders"
 * and "lopende-productielijnen" (the "a/b" sources); `bestelAdvies` is only
 * populated for `bron` "min-max-voorraad" (the "c" source); `prodLijnnr` is
 * only populated for "lopende-productielijnen".
 */
export type LakproductieItem = {
  bron: LakproductieBron;
  artnr: string;
  omschrijving: string;
  ledAlu: string;
  behandeling: string;
  kleursoort: string;
  kleurkode: string;
  afwerking: string;
  techniek: string;
  groepeerKleur: string;
  typeAfwerking: string;
  ledType: string;
  ledKenmerk: string;
  lakLevnr: number;
  lakNaam: string;
  voorraad: number;
  gereserveerdVoorraad: number;
  extVoorraad: number;
  extGereserveerd: number;
  voorbewerkingNodig: boolean;
  premontageDatum: string | null;
  verkoop1Maand: number;
  verkoop3Maand: number;
  verkoop6Maand: number;
  verkoop9Maand: number;
  verkoop12Maand: number;
  // a/b only (null for "min-max-voorraad"):
  bonnr: number | null;
  klant: string | null;
  lijnnr: number | null;
  prodLijnnr: number | null;
  groepnr: number | null;
  subgroepnr: number | null;
  aantal: number | null;
  lijnGereserveerd: number | null;
  lijnBesteld: number | null;
  status: LakproductieStatus | null;
  deadline: string | null;
  ordnr: number | null;
  orderLevnr: number | null;
  orderNaam: string | null;
  orderDatum: string | null;
  maatBevestigd: boolean | null;
  kleurOnbepaald: boolean;
  // c only (null for "lopende-orders"/"lopende-productielijnen"):
  bestelAdvies: number | null;
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

export type BestelorderItem = {
  ordnr: number;
  stempel: string;
  datum: string | null;
  levnr: number;
  naam: string;
  stad: string;
  munt: string;
  bedrag: number;
  levDatum: string | null;
  geparkeerd: boolean;
  uRef: string;
  opm: string;
};

type BestelordersResponse = {
  items: BestelorderItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * Paged list of bestelorders (purchase orders to suppliers, `order`
 * table) - not to be confused with `bon` (customer orders, "Orders &
 * Productie"). No exact total count is available (same reasoning as
 * getArtikelen/getBonnen) - so pagination relies on `hasMore` rather than
 * a page count. Filter by `levnr` (supplier number, exact).
 * Backend: GET /web/bestelorder (Luna.Web.BestelorderHandler, read-only).
 */
export async function getBestelorders(
  params: { levnr?: number; page?: number; pageSize?: number } = {}
): Promise<BestelordersResponse> {
  const { levnr, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (levnr !== undefined) query.set("levnr", String(levnr));
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return apiGet<BestelordersResponse>(`/bestelorder?${query.toString()}`);
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

export type FactuurItem = {
  facnr: number;
  type: boolean;
  stempel: string;
  datum: string | null;
  klnr: number;
  naam: string;
  adres: string;
  postnr: string;
  stad: string;
  munt: string;
  uRef: string;
  oRef: string;
  vervaldat: string | null;
  swBetaald: boolean;
  bdatum: string | null;
  nBedrag: number;
  bBedrag: number;
  totBtw: number;
  totaal: number;
  voorschot: number;
  swFactuur: boolean;
  projectnr: number;
  opm: string;
};

type FacturenResponse = {
  items: FactuurItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * Paged list of facturen (invoices). No exact total count is available
 * (same reasoning as getArtikelen) - so pagination relies on `hasMore`
 * rather than a page count. Filter by `klnr`, `naam`, `datum` and/or
 * `projectnr`.
 * Backend: GET /web/factuur (Luna.Web.FactuurHandler, read-only).
 */
export async function getFacturen(
  params: {
    klnr?: number;
    naam?: string;
    datum?: string;
    projectnr?: number;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<FacturenResponse> {
  const { klnr, naam, datum, projectnr, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (klnr !== undefined) query.set("klnr", String(klnr));
  if (naam !== undefined) query.set("naam", naam);
  if (datum !== undefined) query.set("datum", datum);
  if (projectnr !== undefined) query.set("projectnr", String(projectnr));
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return apiGet<FacturenResponse>(`/factuur?${query.toString()}`);
}

/**
 * Single factuur lookup by facnr. Returns `null` when the backend responds
 * with 404 (factuur not found/removed) instead of throwing, so callers can
 * render a not-found state. Any other non-OK status still throws, mirroring
 * `apiGet`'s error format.
 * Backend: GET /web/factuur/{facnr} (Luna.Web.FactuurHandler).
 */
export async function getFactuur(facnr: number): Promise<FactuurItem | null> {
  const path = `/factuur/${facnr}`;
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

  return response.json() as Promise<FactuurItem>;
}

export type DashboardStatCards = {
  openOffertesCount: number;
  openOffertesBedragPotentieel: number;
  ordersInProductieCount: number;
  ordersInProductieLeverenDezeWeek: number;
  omzetDezeMaand: number;
  omzetVsVorigeMaandPct: number | null;
  lageVoorraadCount: number;
};

export type DashboardActivityItem = {
  text: string;
  datum: string | null;
  type: "offerte" | "bon" | "factuur";
};

export type DashboardProductionItem = {
  bonnr: number;
  klant: string;
  leverdatum: string | null;
  bedrag: number;
  geparkeerd: boolean;
};

export type DashboardResponse = {
  statCards: DashboardStatCards;
  recentActivity: DashboardActivityItem[];
  productionThisWeek: DashboardProductionItem[];
};

/**
 * Dashboard summary: stat cards, recent activity and open orders due this
 * week - all derived server-side from offerte/bon/factuur/artikel (there is
 * no activity-log or production-stage table in the schema).
 *
 * Unlike every other `apiGet` call, this one is deliberately cached for 60s
 * (`next.revalidate`) instead of `no-store`: the backend's "lage voorraad"
 * stat requires a full scan of ~1.8M `artikel` rows (no index on
 * stock/aantal/minv - see Luna.BusinessLogic.DashboardBE), which takes
 * ~45s. Without caching, every dashboard page load would pay that cost;
 * with it, only one request per minute does.
 * Backend: GET /web/dashboard (Luna.Web.DashboardHandler).
 */
export async function getDashboard(): Promise<DashboardResponse> {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    method: "GET",
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`API request to /dashboard failed with status ${response.status}`);
  }

  return response.json() as Promise<DashboardResponse>;
}
