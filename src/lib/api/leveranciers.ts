import { request, pathSegment } from "./http";

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
  params: { naam?: string; page?: number; pageSize?: number } = {},
): Promise<LeveranciersResponse> {
  const { naam, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  const naamPart = naam ? `&naam=${encodeURIComponent(naam)}` : "";
  return request<LeveranciersResponse>("GET", `/leverancier?${query.toString()}${naamPart}`);
}

/**
 * Single leverancier lookup by levnr. Returns `null` when the backend
 * responds with 404 (leverancier not found/removed) instead of throwing,
 * so callers can render a not-found state. Any other non-OK status still
 * throws, mirroring `request`'s error format.
 * Backend: GET /web/leverancier/{levnr} (Luna.Web.LeverancierHandler).
 */
export async function getLeverancier(
  levnr: number,
): Promise<LeverancierItem | null> {
  const path = `/leverancier/${pathSegment(levnr)}`;
  return request<LeverancierItem>("GET", path, { nullOn404: true, backendErrorMessages: false });
}

/**
 * Creation payload for a leverancier - `levnr` is required (chosen by the
 * caller, not server-generated) and every other field is optional.
 */
export type CreateLeverancierPayload = Partial<
  Omit<LeverancierItem, "levnr">
> & {
  levnr: number;
};

/**
 * Creates a new leverancier.
 * Backend: POST /web/leverancier (Luna.Web.LeverancierHandler).
 */
export async function createLeverancier(
  payload: CreateLeverancierPayload,
): Promise<LeverancierItem> {
  return request<LeverancierItem>("POST", "/leverancier", { body: payload });
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
  payload: UpdateLeverancierPayload,
): Promise<LeverancierItem> {
  return request<LeverancierItem>("PUT", `/leverancier/${pathSegment(levnr)}`, { body: payload });
}

/**
 * Deletes a leverancier.
 * Backend: DELETE /web/leverancier/{levnr} (Luna.Web.LeverancierHandler).
 */
export async function deleteLeverancier(
  levnr: number,
): Promise<{ status: string; levnr: number }> {
  return request<{ status: string; levnr: number }>("DELETE", `/leverancier/${pathSegment(levnr)}`);
}
