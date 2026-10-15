import { request, pathSegment } from "./http";

export type PakbonItem = {
  paknr: number;
  stempel: string;
  datum: string | null;
  klnr: number;
  naam: string;
  naam1: string;
  adres: string;
  postnr: string;
  stad: string;
  lnaam: string;
  ladres: string;
  lpostnr: string;
  lstad: string;
  munt: string;
  nBedrag: number;
  bBedrag: number;
  totBtw: number;
  uRef: string;
  opm: string;
  swProforma: boolean;
  facnr: number;
  batchnr: number;
  validatie: boolean;
  afgedrukt: boolean;
  afgehaald: boolean;
  afgehaaldId: string;
  afgehaaldDatum: string | null;
  afgehaaldUur: string;
  compleet: boolean;
  tracknr: string;
  verzending: string;
  projectnr: number;
};

type PakbonnenResponse = {
  items: PakbonItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * Paged list of pakbonnen (packing slips). No exact total count is
 * available (same reasoning as getArtikelen/getBonnen) - so pagination
 * relies on `hasMore` rather than a page count.
 * Backend: GET /web/pakbon (Luna.Web.PakbonHandler).
 */
export async function getPakbonnen(
  params: {
    klnr?: number;
    stempel?: string;
    paknr?: string;
    naam?: string;
    projectnr?: number;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PakbonnenResponse> {
  const {
    klnr,
    stempel,
    paknr,
    naam,
    projectnr,
    page = 1,
    pageSize = 25,
  } = params;
  const query = new URLSearchParams();
  if (klnr !== undefined) query.set("klnr", String(klnr));
  if (stempel) query.set("stempel", stempel);
  if (paknr) query.set("paknr", paknr);
  if (naam) query.set("naam", naam);
  if (projectnr !== undefined) query.set("projectnr", String(projectnr));
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return request<PakbonnenResponse>("GET", `/pakbon?${query.toString()}`);
}

/**
 * Single pakbon lookup by paknr. Returns `null` when the backend responds
 * with 404 (pakbon not found/removed) instead of throwing, so callers can
 * render a not-found state. Any other non-OK status still throws,
 * with an ApiError carrying the generic "API request to <path> failed with status <n>" message (the error body is not read).
 * Backend: GET /web/pakbon/{paknr} (Luna.Web.PakbonHandler).
 */
export async function getPakbon(paknr: number): Promise<PakbonItem | null> {
  const path = `/pakbon/${pathSegment(paknr)}`;
  return request<PakbonItem>("GET", path, { nullOn404: true, backendErrorMessages: false });
}

/**
 * Creation payload for a pakbon - `paknr` is required (chosen by the
 * caller, matching the leverancier CRUD convention in this client) and
 * every other field is optional.
 */
export type CreatePakbonPayload = Partial<Omit<PakbonItem, "paknr">> & {
  paknr: number;
};

/**
 * Backend: POST /web/pakbon (Luna.Web.PakbonHandler).
 */
export async function createPakbon(
  payload: CreatePakbonPayload,
): Promise<PakbonItem> {
  return request<PakbonItem>("POST", "/pakbon", { body: payload });
}

export type UpdatePakbonPayload = Partial<Omit<PakbonItem, "paknr">>;

/**
 * Backend: PUT /web/pakbon/{paknr} (Luna.Web.PakbonHandler).
 */
export async function updatePakbon(
  paknr: number,
  payload: UpdatePakbonPayload,
): Promise<PakbonItem> {
  return request<PakbonItem>("PUT", `/pakbon/${pathSegment(paknr)}`, { body: payload });
}

/**
 * Backend: DELETE /web/pakbon/{paknr} (Luna.Web.PakbonHandler).
 */
export async function deletePakbon(
  paknr: number,
): Promise<{ status: string; paknr: number }> {
  return request<{ status: string; paknr: number }>("DELETE", `/pakbon/${pathSegment(paknr)}`);
}

/**
 * Marks a pakbon as afgehaald (picked up) by a given identification.
 * Returns the full, updated pakbon.
 * Backend: POST /web/pakbon/{paknr}/afhalen (Luna.Web.PakbonHandler).
 */
export async function afhalenPakbon(
  paknr: number,
  afgehaaldId: string,
): Promise<PakbonItem> {
  return request<PakbonItem>("POST", `/pakbon/${pathSegment(paknr)}/afhalen`, { body: { afgehaaldId } });
}

export type PaklijnItem = {
  paknr: number;
  lijnnr: number;
  groepnr: number;
  subgroepnr: number;
  artnr: string;
  omschr: string;
  aantal: number;
  teLeveren: number;
  afgehaald: number;
  vprijs: number;
  aprijs: number;
  korting: number;
  btwKode: string;
  bedrag: number;
  stempel: string;
  klnr: number;
  bonnr: number;
  blijnnr: number;
  hold: boolean;
  swLed: boolean;
  swSikta: boolean;
  subtotaal: boolean;
  kolomtitel: boolean;
  infolijn: boolean;
  opm: string;
};

type PaklijnenResponse = {
  items: PaklijnItem[];
};

/**
 * Paklijnen (packing slip lines) for a single pakbon - no paging, a
 * pakbon typically has a bounded number of lines.
 * Backend: GET /web/pakbon/{paknr}/lijn (Luna.Web.PakbonHandler).
 */
export async function getPaklijnen(paknr: number): Promise<PaklijnItem[]> {
  const data = await request<PaklijnenResponse>("GET", `/pakbon/${pathSegment(paknr)}/lijn`);
  return data.items;
}

export type CreatePaklijnPayload = Omit<PaklijnItem, "paknr" | "lijnnr">;

/**
 * Backend: POST /web/pakbon/{paknr}/lijn (Luna.Web.PakbonHandler).
 */
export async function createPaklijn(
  paknr: number,
  payload: CreatePaklijnPayload,
): Promise<PaklijnItem> {
  return request<PaklijnItem>("POST", `/pakbon/${pathSegment(paknr)}/lijn`, { body: payload });
}

export type UpdatePaklijnPayload = Partial<CreatePaklijnPayload>;

/**
 * Backend: PUT /web/pakbon/{paknr}/lijn/{lijnnr} (Luna.Web.PakbonHandler).
 */
export async function updatePaklijn(
  paknr: number,
  lijnnr: number,
  payload: UpdatePaklijnPayload,
): Promise<PaklijnItem> {
  return request<PaklijnItem>("PUT", `/pakbon/${pathSegment(paknr)}/lijn/${pathSegment(lijnnr)}`, { body: payload });
}

/**
 * Backend: DELETE /web/pakbon/{paknr}/lijn/{lijnnr} (Luna.Web.PakbonHandler).
 */
export async function deletePaklijn(
  paknr: number,
  lijnnr: number,
): Promise<{ status: string; lijnnr: number }> {
  return request<{ status: string; lijnnr: number }>("DELETE", `/pakbon/${pathSegment(paknr)}/lijn/${pathSegment(lijnnr)}`);
}
