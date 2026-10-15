import { request, pathSegment } from "./http";

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
  } = {},
): Promise<FacturenResponse> {
  const { klnr, naam, datum, projectnr, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (klnr !== undefined) query.set("klnr", String(klnr));
  if (naam !== undefined) query.set("naam", naam);
  if (datum !== undefined) query.set("datum", datum);
  if (projectnr !== undefined) query.set("projectnr", String(projectnr));
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return request<FacturenResponse>("GET", `/factuur?${query.toString()}`);
}

/**
 * Single factuur lookup by facnr. Returns `null` when the backend responds
 * with 404 (factuur not found/removed) instead of throwing, so callers can
 * render a not-found state. Any other non-OK status still throws, mirroring
 * `request`'s error format.
 * Backend: GET /web/factuur/{facnr} (Luna.Web.FactuurHandler).
 */
export async function getFactuur(facnr: number): Promise<FactuurItem | null> {
  const path = `/factuur/${pathSegment(facnr)}`;
  return request<FactuurItem>("GET", path, { nullOn404: true, backendErrorMessages: false });
}
