import { request, pathSegment } from "./http";

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
  // Raw offerte status code (e.g. "O" = open/overdraagbaar, "D" = omgezet
  // naar order) - drives whether "Omzetten naar Order" is enabled. See
  // docs/backend/offerte-conversie.md.
  stempel: string;
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
  params: {
    klnr?: number;
    offnr?: string;
    naam?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<OffertenResponse> {
  const { klnr, offnr, naam, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (klnr !== undefined) query.set("klnr", String(klnr));
  if (offnr) query.set("offnr", offnr);
  if (naam) query.set("naam", naam);
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return request<OffertenResponse>("GET", `/offerte?${query.toString()}`);
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
 * throws, mirroring `request`'s error format.
 * Backend: GET /web/offerte/{offnr}/{versie} (Luna.Web.OfferteHandler).
 */
export async function getOfferte(
  offnr: number,
  versie: number,
): Promise<OfferteItem | null> {
  const path = `/offerte/${pathSegment(offnr)}/${pathSegment(versie)}`;
  return request<OfferteItem>("GET", path, { nullOn404: true, backendErrorMessages: false });
}

/**
 * List of offlijn (quote line) rows for a single offerte revision. No
 * paging - a quote typically has a bounded number of lines.
 * Backend: GET /web/offerte/{offnr}/{versie}/lijn (Luna.Web.OfferteHandler,
 * read-only).
 */
export async function getOfferteLijnen(
  offnr: number,
  versie: number,
): Promise<OfflijnItem[]> {
  const data = await request<OfflijnenResponse>("GET", `/offerte/${pathSegment(offnr)}/${pathSegment(versie)}/lijn`);
  return data.items;
}

export type CreateOffertePayload = Partial<
  Omit<OfferteItem, "offnr" | "versie" | "klnr">
> & {
  klnr: number;
};

/**
 * Creates a new offerte. `offnr`/`versie` are server-allocated - do not
 * send them in the payload.
 * Backend: POST /web/offerte (Luna.Web.OfferteHandler).
 */
export async function createOfferte(
  payload: CreateOffertePayload,
): Promise<OfferteItem> {
  return request<OfferteItem>("POST", "/offerte", { body: payload });
}

/**
 * Partial update payload for an offerte - every field is optional (only
 * fields present are changed) and `offnr`/`versie`/`klnr` are deliberately
 * excluded (immutable identifiers).
 */
export type UpdateOffertePayload = Partial<
  Omit<OfferteItem, "offnr" | "versie" | "klnr">
>;

/**
 * Updates an offerte. Only the fields present in `payload` are changed.
 * The `verloren`-auto-clear rule is applied server-side - no client logic
 * needed.
 * Backend: PUT /web/offerte/{offnr}/{versie} (Luna.Web.OfferteHandler).
 */
export async function updateOfferte(
  offnr: number,
  versie: number,
  payload: UpdateOffertePayload,
): Promise<OfferteItem> {
  return request<OfferteItem>("PUT", `/offerte/${pathSegment(offnr)}/${pathSegment(versie)}`, { body: payload });
}

export type OmzettenNaarOrderResult = {
  bonnr: number;
  offnr: number;
  versie: number;
  offerteStempel: "B" | "D";
  aantalLijnenOvergenomen: number;
  aantalLedLijnenOvergenomen: number;
  totBtw: number;
  totaalBasis: number;
  totaalInclBtw: number;
};

/**
 * Converts an offerte into a bon (customer order) - creates the bon +
 * bonlijn rows from the offerte's overdraagbare lijnen and flips the
 * offerte's stempel. 404 if the offerte isn't found; 409 if
 * `offerte.stempel<>"O"` (already converted or otherwise not
 * convertible); 400 if there are no overdraagbare lijnen or a conversion
 * error propagates - callers should surface that message as-is.
 * Backend: POST /web/offerte/{offnr}/{versie}/omzetten-naar-order
 * (Luna.Web.OfferteHandler).
 */
export async function omzettenNaarOrder(
  offnr: number,
  versie: number,
): Promise<OmzettenNaarOrderResult> {
  return request<OmzettenNaarOrderResult>("POST", `/offerte/${pathSegment(offnr)}/${pathSegment(versie)}/omzetten-naar-order`, { body: {} });
}

export type CreateOfflijnPayload = Partial<
  Omit<OfflijnItem, "offnr" | "versie" | "lijnnr">
>;

/**
 * Creates a new offlijn (quote line) under an offerte. `lijnnr` is
 * server-allocated (+10 from the previous line) - do not send it.
 * Backend: POST /web/offerte/{offnr}/{versie}/lijn (Luna.Web.OfferteHandler).
 */
export async function createOfflijn(
  offnr: number,
  versie: number,
  payload: CreateOfflijnPayload,
): Promise<OfflijnItem> {
  return request<OfflijnItem>("POST", `/offerte/${pathSegment(offnr)}/${pathSegment(versie)}/lijn`, { body: payload });
}

export type UpdateOfflijnPayload = Partial<
  Omit<OfflijnItem, "offnr" | "versie" | "lijnnr">
>;

/**
 * Updates an offlijn. Only the fields present in `payload` are changed.
 * Backend: PUT /web/offerte/{offnr}/{versie}/lijn/{lijnnr}
 * (Luna.Web.OfferteHandler).
 */
export async function updateOfflijn(
  offnr: number,
  versie: number,
  lijnnr: number,
  payload: UpdateOfflijnPayload,
): Promise<OfflijnItem> {
  return request<OfflijnItem>("PUT", `/offerte/${pathSegment(offnr)}/${pathSegment(versie)}/lijn/${pathSegment(lijnnr)}`, { body: payload });
}

export type DeleteOfflijnResult = {
  status: string;
  offnr: number;
  versie: number;
  lijnnr: number;
};

/**
 * Deletes an offlijn.
 * Backend: DELETE /web/offerte/{offnr}/{versie}/lijn/{lijnnr}
 * (Luna.Web.OfferteHandler).
 */
export async function deleteOfflijn(
  offnr: number,
  versie: number,
  lijnnr: number,
): Promise<DeleteOfflijnResult> {
  return request<DeleteOfflijnResult>("DELETE", `/offerte/${pathSegment(offnr)}/${pathSegment(versie)}/lijn/${pathSegment(lijnnr)}`);
}

export type ReorderDirection = "up" | "down";

/**
 * Moves an offlijn up/down among its siblings. Returns the full,
 * re-ordered list of lines (not just the moved one) - the backend response
 * is `{ items: OfflijnItem[] }`.
 * Backend: POST /web/offerte/{offnr}/{versie}/lijn/{lijnnr}/reorder
 * (Luna.Web.OfferteHandler).
 */
export async function reorderOfflijn(
  offnr: number,
  versie: number,
  lijnnr: number,
  direction: ReorderDirection,
): Promise<OfflijnItem[]> {
  const data = await request<{ items: OfflijnItem[] }>("POST", `/offerte/${pathSegment(offnr)}/${pathSegment(versie)}/lijn/${pathSegment(lijnnr)}/reorder`, { body: { direction } });
  return data.items;
}
