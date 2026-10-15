import { request, pathSegment } from "./http";

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
  } = {},
): Promise<BestelordersResponse> {
  const {
    levnr,
    ordnr,
    naam,
    sortField,
    sortDir,
    page = 1,
    pageSize = 25,
  } = params;
  const query = new URLSearchParams();
  if (levnr !== undefined) query.set("levnr", String(levnr));
  if (ordnr) query.set("ordnr", ordnr);
  if (naam) query.set("naam", naam);
  if (sortField) query.set("sortField", sortField);
  if (sortDir) query.set("sortDir", sortDir);
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return request<BestelordersResponse>("GET", `/bestelorder?${query.toString()}`);
}

/**
 * Single bestelorder lookup by ordnr. Returns `null` when the backend
 * responds with 404 (order not found/removed) instead of throwing, so
 * callers can render a not-found state. Any other non-OK status still
 * throws, with an ApiError carrying the generic "API request to <path> failed with status <n>" message (the error body is not read).
 * Backend: GET /web/bestelorder/{ordnr} (Luna.Web.BestelorderHandler).
 */
export async function getBestelorder(
  ordnr: number,
): Promise<BestelorderItem | null> {
  const path = `/bestelorder/${pathSegment(ordnr)}`;
  return request<BestelorderItem>("GET", path, { nullOn404: true, backendErrorMessages: false });
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
export async function getBestelorderLijnen(
  ordnr: number,
): Promise<BestelorderLijnItem[]> {
  const data = await request<BestelorderLijnenResponse>("GET", `/bestelorder/${pathSegment(ordnr)}/lijn`);
  return data.items;
}
