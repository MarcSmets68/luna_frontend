import { request, pathSegment } from "./http";

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
 * naam1 "Marc". Pass `nomaled: true` to restrict the list to
 * Nomaled-dealer customers only; combines with `naam` as an AND filter.
 * Defaults to `false` (no filter, all customers) so existing call sites
 * without this option keep their current behavior.
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
  params: {
    naam?: string;
    page?: number;
    pageSize?: number;
    nomaled?: boolean;
  } = {},
): Promise<KlantenResponse> {
  const { naam, page = 1, pageSize = 25, nomaled = false } = params;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (nomaled) query.set("nomaled", "true");
  const naamPart = naam ? `&naam=${encodeURIComponent(naam)}` : "";
  return request<KlantenResponse>("GET", `/klant?${query.toString()}${naamPart}`);
}

/**
 * Single klant lookup by klnr. Returns `null` when the backend responds
 * with 404 (klant not found/removed) instead of throwing, so callers can
 * render a not-found state. Any other non-OK status still throws, mirroring
 * `request`'s error format.
 * Backend: GET /web/klant/{klnr} (Luna.Web.KlantHandler).
 */
export async function getKlant(klnr: number): Promise<KlantItem | null> {
  const path = `/klant/${pathSegment(klnr)}`;
  return request<KlantItem>("GET", path, { nullOn404: true, backendErrorMessages: false });
}

export type CreateKlantPayload = Partial<Omit<KlantItem, "klnr">> & {
  klnr: number;
};

/**
 * Creates a new klant.
 * Backend: POST /web/klant (Luna.Web.KlantHandler).
 */
export async function createKlant(
  payload: CreateKlantPayload,
): Promise<KlantItem> {
  return request<KlantItem>("POST", "/klant", { body: payload });
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
  payload: UpdateKlantPayload,
): Promise<KlantItem> {
  return request<KlantItem>("PUT", `/klant/${pathSegment(klnr)}`, { body: payload });
}

export type KlantAdresItem = {
  klnr: number;
  lijnnr: number;
  naam: string;
  naam1: string;
  adres: string;
  postnr: string;
  stad: string;
  standaard: boolean;
};

type KlantAdressenResponse = {
  items: KlantAdresItem[];
};

/**
 * Adressen (delivery/billing addresses) for a klant. No pagination -
 * the backend returns every address for the klnr in one response.
 * Backend: GET /web/klant/{klnr}/adres (Luna.Web.KlantHandler, read-only).
 */
export async function getKlantAdressen(
  klnr: number,
): Promise<KlantAdresItem[]> {
  const data = await request<KlantAdressenResponse>("GET", `/klant/${pathSegment(klnr)}/adres`);
  return data.items;
}

export type KlantContactItem = {
  klnr: number;
  lijnnr: number;
  naam: string;
  voornaam: string;
  aanspreking: string;
  netTel: string;
  tel: string;
  gsm: string;
  email: string;
  standaard: boolean;
  opm: string;
  soort: string;
};

type KlantContactenResponse = {
  items: KlantContactItem[];
};

/**
 * Contactpersonen for a klant. No pagination - the backend returns every
 * contact for the klnr in one response.
 * Backend: GET /web/klant/{klnr}/contact (Luna.Web.KlantHandler, read-only).
 */
export async function getKlantContacten(
  klnr: number,
): Promise<KlantContactItem[]> {
  const data = await request<KlantContactenResponse>("GET", `/klant/${pathSegment(klnr)}/contact`);
  return data.items;
}

export type KlantKortingItem = {
  klnr: number;
  artnr: string;
  korting: number;
  naam: string;
};

type KlantKortingenResponse = {
  items: KlantKortingItem[];
};

/**
 * Klant-specifieke kortingen (per-artikel discounts) for a klant. No
 * pagination - the backend returns every korting row for the klnr in one
 * response. `naam` is server-derived (the artikel's naam) and read-only.
 * Backend: GET /web/klant/{klnr}/korting (Luna.Web.KlantHandler, read-only).
 */
export async function getKlantKortingen(
  klnr: number,
): Promise<KlantKortingItem[]> {
  const data = await request<KlantKortingenResponse>("GET", `/klant/${pathSegment(klnr)}/korting`);
  return data.items;
}
