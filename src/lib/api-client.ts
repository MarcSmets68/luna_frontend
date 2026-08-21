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

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? `API request to ${path} failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? `API request to ${path} failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? `API request to ${path} failed with status ${response.status}`
    );
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
  verpakking: number;
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

export type CreateBestellingLine = {
  artnr: string;
  omschrijving: string;
  aantal: number;
  // Link naar de klantorder-lijn deze bestelling-regel bedoeld is voor -
  // weggelaten voor min-max-voorraad-regels (geen klantlink). `volgnr`
  // erbij betekent dat de lijn uit een productielijn (bonlijn_productie)
  // komt i.p.v. rechtstreeks uit een bonlijn.
  bonnr?: number;
  blijnnr?: number;
  volgnr?: number;
};

export type CreateBestellingRequest = {
  levnr: number;
  lines: CreateBestellingLine[];
};

export type BestellingResult = {
  ordnr: number;
  levnr: number;
  naam: string;
  datum: string | null;
  munt: string;
  lines: Array<{
    ordnr: number;
    lijnnr: number;
    artnr: string;
    omschrijving: string;
    aantal: number;
    bonnr: number | null;
    blijnnr: number | null;
    volgnr: number | null;
  }>;
};

/**
 * Creëert een nieuwe inkooporder (`order` + `ordlijn`) vanuit een
 * bevestigde Lakproduktie bestelling-preview. Regels met een
 * bonnr/blijnnr(/volgnr) worden gekoppeld aan de klantorder(-lijn) zodat
 * bij levering duidelijk is voor wie het bedoeld is; regels zonder link
 * zijn zuivere voorraadaanvulling (min-max-voorraad).
 * Backend: POST /web/lakproduktie/bestelling (Luna.Web.LakproductieHandler
 * + Luna.BusinessLogic.LakproductieBestellingBE).
 */
export async function createLakproductieBestelling(
  payload: CreateBestellingRequest
): Promise<BestellingResult> {
  return apiPost<BestellingResult>("/lakproduktie/bestelling", payload);
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
  // --- Voorraad Fase 1 (FR-1/FR-2/FR-3) ---
  voorraadExtern: number;
  gereserveerd: number;
  gereserveerdExtern: number;
  beschikbaar: number;
  beschikbaarExtern: number;
  onderMinimumIntern: boolean;
  onderMinimumExtern: boolean;
  // Detail-only in de praktijk, maar altijd aanwezig in het contract - de
  // lijst vult ze ook (zie architectuurontwerp §2.1, geen aparte CopyToTt-pad).
  magazijn: string;
  voorraadMinExtern: number;
  voorraadMaxExtern: number;
  swExtern: boolean;
  swExProductie: boolean;
  isSamengesteld: boolean;
};

type ArtikelenResponse = {
  items: ArtikelItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/** FR-2: "onder minimum"-filter, één 3-waardige query-param i.p.v. twee losse
 * booleans - zie architectuurontwerp §1.2.1 (OD-1) voor de motivatie. */
export type OnderMinimumFilter = "intern" | "extern" | "beide";

/**
 * Paged list of artikelen (products/inventory). No exact total count is
 * available - see Backend/README.md ("No exact totalCount") - so pagination
 * relies on `hasMore` rather than a page count. `filters.onderMinimum` and
 * `filters.externInBewerking` are optional, AND-combined server-side (FR-2).
 * Backend: GET /web/artikel (Luna.Web.ArtikelHandler).
 */
export async function getArtikelen(
  page = 1,
  pageSize = 25,
  filters: { onderMinimum?: OnderMinimumFilter; externInBewerking?: boolean } = {}
): Promise<ArtikelenResponse> {
  const { onderMinimum, externInBewerking } = filters;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (onderMinimum) query.set("onderMinimum", onderMinimum);
  if (externInBewerking !== undefined) query.set("externInBewerking", String(externInBewerking));
  return apiGet<ArtikelenResponse>(`/artikel?${query.toString()}`);
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

export type BeschikbaarheidComponent = {
  componentArtnr: string;
  componentOmschrijving: string;
  benodigdPerEenheid: number;
  componentVoorraad: number;
  bouwbaarUitDitComponent: number;
  isBottleneck: boolean;
};

export type Beschikbaarheid = {
  artnr: string;
  isSamengesteld: boolean;
  bouwbareEenheden: number | null;
  siktaUitzonderingToegepast: boolean;
  componenten: BeschikbaarheidComponent[];
};

/**
 * FR-4: on-demand composiet-artikel beschikbaarheid ("Hoeveel kan ik nog
 * bouwen?"). Nooit aangeroepen vanuit de lijst-view - enkel lazy vanuit de
 * detailpagina bij tab-activatie (zie architectuurontwerp §3.4).
 * Backend: GET /web/artikel/{artnr}/beschikbaarheid (Luna.Web.ArtikelHandler
 * + Luna.BusinessLogic.StockAvailabilityBE).
 */
export async function getArtikelBeschikbaarheid(artnr: string): Promise<Beschikbaarheid> {
  return apiGet<Beschikbaarheid>(`/artikel/${encodeURIComponent(artnr)}/beschikbaarheid`);
}

export type ArtlogItem = {
  artnr: string;
  lijnnr: number;
  datum: string | null;
  uur: string;
  beweging: string; // ruwe, ongevertaalde code (BR-3) - niet vertalen in de UI
  aantal: number;
  stock: number;
  docnr: string;
  omschr: string;
  kllev: number;
  naam: string;
  aprijs: number;
  munt: string;
  koers: number;
  opm: string;
  refLev: string;
  id: string;
  swControle: boolean;
  cdatum: string | null;
};

type ArtlogResponse = {
  items: ArtlogItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * FR-5: gepagineerde bewegingshistoriek (`artlog`) voor een artikel. Lazy,
 * eigen lokale paginatie binnen de "Bewegingen"-tab (niet in de hoofd-URL) -
 * zie architectuurontwerp §3.4.
 * Backend: GET /web/artikel/{artnr}/artlog (Luna.Web.ArtikelHandler +
 * Luna.BusinessLogic.ArtlogBE).
 */
export async function getArtlog(
  artnr: string,
  params: { page?: number; pageSize?: number; datumVan?: string; datumTot?: string; beweging?: string } = {}
): Promise<ArtlogResponse> {
  const { page = 1, pageSize = 25, datumVan, datumTot, beweging } = params;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (datumVan) query.set("datumVan", datumVan);
  if (datumTot) query.set("datumTot", datumTot);
  if (beweging) query.set("beweging", beweging);
  return apiGet<ArtlogResponse>(`/artikel/${encodeURIComponent(artnr)}/artlog?${query.toString()}`);
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
 * relies on `hasMore` rather than a page count. Pass `naam` to filter to
 * customers matching every space-separated word (case-insensitive, any
 * order) across naam/naam1 - e.g. "Smets Marc" matches naam "Smets" /
 * naam1 "Marc".
 *
 * The `naam` value is deliberately appended with encodeURIComponent
 * rather than through URLSearchParams: URLSearchParams serializes spaces
 * as "+" (the legacy form-urlencoded convention), but a multi-word naam
 * filter needs each space to reach the backend as "%20" - same reasoning
 * as getArtikel() - OpenEdge's query-value decoder does not treat "+" as
 * a space, so a "+" would silently glue the words together and never
 * split on KlantBE's word-boundary match.
 * Backend: GET /web/klant (Luna.Web.KlantHandler).
 */
export async function getKlanten(
  params: { naam?: string; page?: number; pageSize?: number } = {}
): Promise<KlantenResponse> {
  const { naam, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  const naamPart = naam ? `&naam=${encodeURIComponent(naam)}` : "";
  return apiGet<KlantenResponse>(`/klant?${query.toString()}${naamPart}`);
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
 * customer's offertes. Also filterable by `offnr` (prefix match on the
 * quote number) and/or `naam` (substring match on the customer name),
 * both optional and server-side. No sorting support on this endpoint.
 * Backend: GET /web/offerte (Luna.Web.OfferteHandler, read-only for now).
 */
export async function getOffertes(
  params: { klnr?: number; offnr?: string; naam?: string; page?: number; pageSize?: number } = {}
): Promise<OffertenResponse> {
  const { klnr, offnr, naam, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (klnr !== undefined) query.set("klnr", String(klnr));
  if (offnr) query.set("offnr", offnr);
  if (naam) query.set("naam", naam);
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return apiGet<OffertenResponse>(`/offerte?${query.toString()}`);
}

export type OfflijnItem = {
  offnr: number;
  versie: number;
  lijnnr: number;
  groepnr: number;
  subgroepnr: number;
  artnr: string;
  omschrijving: string;
  omschrijvingOfferte: string;
  aantal: number;
  teLeveren: number;
  verkoopprijs: number;
  brutoVerkoopprijs: number;
  korting: number;
  btwKode: string;
  bedrag: number;
  bruto: number;
  aankoopprijs: number;
  opm: string;
  bestellen: boolean;
  blokkeren: boolean;
  subtotaal: boolean;
  kolomtitel: boolean;
  infolijn: boolean;
};

type OfflijnenResponse = {
  items: OfflijnItem[];
};

/**
 * Single offerte lookup by offnr+versie. Returns `null` when the backend
 * responds with 404 (offerte not found/removed) instead of throwing, so
 * callers can render a not-found state. Any other non-OK status still
 * throws, mirroring `apiGet`'s error format.
 * Backend: GET /web/offerte/{offnr}/{versie} (Luna.Web.OfferteHandler).
 */
export async function getOfferte(offnr: number, versie: number): Promise<OfferteItem | null> {
  const path = `/offerte/${offnr}/${versie}`;
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

  return response.json() as Promise<OfferteItem>;
}

/**
 * List of offlijn (quote line) rows for a single offerte revision. No
 * paging - a quote typically has a bounded number of lines.
 * Backend: GET /web/offerte/{offnr}/{versie}/lijn (Luna.Web.OfferteHandler,
 * read-only).
 */
export async function getOfferteLijnen(offnr: number, versie: number): Promise<OfflijnItem[]> {
  const data = await apiGet<OfflijnenResponse>(`/offerte/${offnr}/${versie}/lijn`);
  return data.items;
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
 * Single bon lookup by bonnr. Returns `null` when the backend responds
 * with 404 (bon not found/removed) instead of throwing, so callers can
 * render a not-found state. Any other non-OK status still throws, mirroring
 * `apiGet`'s error format.
 * Backend: GET /web/bon/{bonnr} (Luna.Web.BonHandler).
 */
export async function getBon(bonnr: number): Promise<BonItem | null> {
  const path = `/bon/${bonnr}`;
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

  return response.json() as Promise<BonItem>;
}

export type BonLijnItem = {
  bonnr: number;
  lijnnr: number;
  stempel: string;
  artnr: string;
  omschrijving: string;
  aantal: number;
  teLeveren: number;
  besteld: number;
  vprijs: number;
  aprijs: number;
  korting: number;
  btwKode: string;
  bedrag: number;
  levDatum: string | null;
  bestelDatum: string | null;
  klnr: number;
  groepnr: number;
  subgroepnr: number;
  hold: boolean;
  opm: string;
  subtotaal: boolean;
  kolomtitel: boolean;
  infolijn: boolean;
};

type BonLijnenResponse = {
  items: BonLijnItem[];
};

/**
 * List of bonlijn (order lines) for a bon - no paging, a bon typically has
 * a bounded number of lines.
 * Backend: GET /web/bon/{bonnr}/lijn (Luna.Web.BonHandler, read-only).
 */
export async function getBonLijnen(bonnr: number): Promise<BonLijnItem[]> {
  const data = await apiGet<BonLijnenResponse>(`/bon/${bonnr}/lijn`);
  return data.items;
}

/**
 * Paged list of bonnen (orders/order confirmations etc.). No exact total
 * count is available (same reasoning as getArtikelen) - so pagination
 * relies on `hasMore` rather than a page count. Filter by `klnr` (exact),
 * `type` (exact, e.g. "ORDERBEVESTIGING"), `bonnr` (prefix match on the
 * order number) and/or `naam` (substring match on the customer name).
 * Backend: GET /web/bon (Luna.Web.BonHandler, read-only).
 */
export async function getBonnen(
  params: {
    klnr?: number;
    type?: string;
    bonnr?: string;
    naam?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<BonnenResponse> {
  const { klnr, type, bonnr, naam, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (klnr !== undefined) query.set("klnr", String(klnr));
  if (type !== undefined) query.set("type", type);
  if (bonnr) query.set("bonnr", bonnr);
  if (naam) query.set("naam", naam);
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

export type BestelorderSortField = "ordnr" | "datum" | "naam" | "stempel";
export type BestelorderSortDir = "asc" | "desc";

type BestelordersResponse = {
  items: BestelorderItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  sortField: BestelorderSortField;
  sortDir: BestelorderSortDir;
};

/**
 * Paged list of bestelorders (purchase orders to suppliers, `order`
 * table) - not to be confused with `bon` (customer orders, "Orders &
 * Productie"). No exact total count is available (same reasoning as
 * getArtikelen/getBonnen) - so pagination relies on `hasMore` rather than
 * a page count. Filter by `levnr` (supplier number, exact), `ordnr`
 * (prefix match on the order number) and/or `naam` (substring match on
 * the leverancier name). Sort by `sortField`/`sortDir` (both optional,
 * default "ordnr"/"desc" - matches the backend's own fallback).
 * Backend: GET /web/bestelorder (Luna.Web.BestelorderHandler, read-only).
 */
export async function getBestelorders(
  params: {
    levnr?: number;
    ordnr?: string;
    naam?: string;
    sortField?: BestelorderSortField;
    sortDir?: BestelorderSortDir;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<BestelordersResponse> {
  const { levnr, ordnr, naam, sortField, sortDir, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (levnr !== undefined) query.set("levnr", String(levnr));
  if (ordnr) query.set("ordnr", ordnr);
  if (naam) query.set("naam", naam);
  if (sortField) query.set("sortField", sortField);
  if (sortDir) query.set("sortDir", sortDir);
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return apiGet<BestelordersResponse>(`/bestelorder?${query.toString()}`);
}

/**
 * Single bestelorder lookup by ordnr. Returns `null` when the backend
 * responds with 404 (order not found/removed) instead of throwing, so
 * callers can render a not-found state. Any other non-OK status still
 * throws, mirroring `apiGet`'s error format.
 * Backend: GET /web/bestelorder/{ordnr} (Luna.Web.BestelorderHandler).
 */
export async function getBestelorder(ordnr: number): Promise<BestelorderItem | null> {
  const path = `/bestelorder/${ordnr}`;
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

  return response.json() as Promise<BestelorderItem>;
}

export type BestelorderLijnItem = {
  ordnr: number;
  lijnnr: number;
  artnr: string;
  omschrijving: string;
  aantal: number;
  teLeveren: number;
  vprijs: number;
  korting: number;
  btwKode: string;
  bedrag: number;
  stempel: string;
  levnr: number;
  levDatum: string | null;
  bonnr: number;
  blijnnr: number;
  volgnr: number;
  opm: string;
};

type BestelorderLijnenResponse = {
  items: BestelorderLijnItem[];
};

/**
 * Every ordlijn (purchase order line) row for a given bestelorder, ordered
 * by lijnnr. Does not 404 if `ordnr` doesn't exist - it just returns an
 * empty list (same reasoning as the backend, see Backend/README.md) -
 * callers that need a not-found state should call `getBestelorder` first.
 * Backend: GET /web/bestelorder/{ordnr}/lijn (Luna.Web.BestelorderHandler).
 */
export async function getBestelorderLijnen(ordnr: number): Promise<BestelorderLijnItem[]> {
  const data = await apiGet<BestelorderLijnenResponse>(`/bestelorder/${ordnr}/lijn`);
  return data.items;
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

/**
 * Partial update payload for a klant - every field is optional (only
 * fields present are changed) and `klnr` is deliberately excluded since
 * it's the immutable primary key (see Luna.BusinessLogic.KlantBE).
 */
export type UpdateKlantPayload = Partial<Omit<KlantItem, "klnr">>;

/**
 * Updates a klant. Only the fields present in `payload` are changed.
 * Backend: PUT /web/klant/{klnr} (Luna.Web.KlantHandler).
 */
export async function updateKlant(
  klnr: number,
  payload: UpdateKlantPayload
): Promise<KlantItem> {
  return apiPut<KlantItem>(`/klant/${klnr}`, payload);
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

export type DevUserItem = {
  kode: string;
  naam: string;
  email: string;
  niveau: number;
  passief: boolean;
};

type DevUsersResponse = {
  items: DevUserItem[];
};

/**
 * Dev-only verification list of Luna users - no auth on this endpoint and
 * it is not linked from production navigation (see Sidebar). The password
 * field is never returned by the backend.
 * Backend: GET /web/dev-users (Luna.Web.DevUsersHandler).
 */
export async function getDevUsers(): Promise<DevUserItem[]> {
  const data = await apiGet<DevUsersResponse>("/dev-users");
  return data.items;
}

export type LeverancierItem = {
  levnr: number;
  naam: string;
  naam1: string;
  contact: string;
  adres: string;
  postnr: string;
  stad: string;
  land: string;
  tel: string;
  fax: string;
  email: string;
  taal: string;
  munt: string;
  btwNr: string;
  saldo: number;
  opm: string;
  type: boolean;
  controle: boolean;
  minBestel: number;
};

type LeveranciersResponse = {
  items: LeverancierItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * Paged list of leveranciers (suppliers). No exact total count is
 * available (same reasoning as getArtikelen) - see Backend/README.md -
 * so pagination relies on `hasMore` rather than a page count. Pass `naam`
 * to filter to suppliers matching the naam (case-insensitive), same
 * substring/word-match semantics as `getKlanten`'s naam filter.
 *
 * The `naam` value is deliberately appended with encodeURIComponent
 * rather than through URLSearchParams: URLSearchParams serializes spaces
 * as "+" (the legacy form-urlencoded convention), but a multi-word naam
 * filter needs each space to reach the backend as "%20" - same reasoning
 * as getKlanten() - OpenEdge's query-value decoder does not treat "+" as
 * a space, so a "+" would silently glue the words together and never
 * split on LeverancierBE's word-boundary match.
 * Backend: GET /web/leverancier (Luna.Web.LeverancierHandler).
 */
export async function getLeveranciers(
  params: { naam?: string; page?: number; pageSize?: number } = {}
): Promise<LeveranciersResponse> {
  const { naam, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  const naamPart = naam ? `&naam=${encodeURIComponent(naam)}` : "";
  return apiGet<LeveranciersResponse>(`/leverancier?${query.toString()}${naamPart}`);
}

/**
 * Single leverancier lookup by levnr. Returns `null` when the backend
 * responds with 404 (leverancier not found/removed) instead of throwing,
 * so callers can render a not-found state. Any other non-OK status still
 * throws, mirroring `apiGet`'s error format.
 * Backend: GET /web/leverancier/{levnr} (Luna.Web.LeverancierHandler).
 */
export async function getLeverancier(levnr: number): Promise<LeverancierItem | null> {
  const path = `/leverancier/${levnr}`;
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

  return response.json() as Promise<LeverancierItem>;
}

/**
 * Creation payload for a leverancier - `levnr` is required (chosen by the
 * caller, not server-generated) and every other field is optional.
 */
export type CreateLeverancierPayload = Partial<Omit<LeverancierItem, "levnr">> & {
  levnr: number;
};

/**
 * Creates a new leverancier.
 * Backend: POST /web/leverancier (Luna.Web.LeverancierHandler).
 */
export async function createLeverancier(
  payload: CreateLeverancierPayload
): Promise<LeverancierItem> {
  return apiPost<LeverancierItem>("/leverancier", payload);
}

/**
 * Partial update payload for a leverancier - every field is optional
 * (only fields present are changed) and `levnr` is deliberately excluded
 * since it's the immutable primary key (see Luna.BusinessLogic.LeverancierBE).
 */
export type UpdateLeverancierPayload = Partial<Omit<LeverancierItem, "levnr">>;

/**
 * Updates a leverancier. Only the fields present in `payload` are changed.
 * Backend: PUT /web/leverancier/{levnr} (Luna.Web.LeverancierHandler).
 */
export async function updateLeverancier(
  levnr: number,
  payload: UpdateLeverancierPayload
): Promise<LeverancierItem> {
  return apiPut<LeverancierItem>(`/leverancier/${levnr}`, payload);
}

/**
 * Deletes a leverancier.
 * Backend: DELETE /web/leverancier/{levnr} (Luna.Web.LeverancierHandler).
 */
export async function deleteLeverancier(
  levnr: number
): Promise<{ status: string; levnr: number }> {
  return apiDelete<{ status: string; levnr: number }>(`/leverancier/${levnr}`);
}
