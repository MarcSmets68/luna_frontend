import { request, pathSegment } from "./http";

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
  // Extra klantnummers / afleveradres / extra bedragen (fase2) - always
  // present on GET responses.
  klnr2: number;
  klnr3: number;
  lnaam: string;
  lnaam1: string;
  ladres: string;
  lpostnr: string;
  lstad: string;
  recupelBedrag: number;
  aBedrag: number;
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
 * `request`'s error format.
 * Backend: GET /web/bon/{bonnr} (Luna.Web.BonHandler).
 */
export async function getBon(bonnr: number): Promise<BonItem | null> {
  const path = `/bon/${pathSegment(bonnr)}`;
  return request<BonItem>("GET", path, { nullOn404: true, backendErrorMessages: false });
}

/**
 * Annuleert een order (stempel -> "O", bedragen gewist behalve btw, reservaties vrijgegeven).
 * Backend: POST /web/bon/{bonnr}/annuleer. Respons = volledige bon (zelfde vorm als GET /web/bon/{bonnr}).
 * Gooit ApiError (status 404 = niet gevonden, 409 = stempel niet V/B) bij een niet-OK respons.
 */
export async function annuleerBon(bonnr: number): Promise<BonItem> {
  return request<BonItem>("POST", `/bon/${pathSegment(bonnr)}/annuleer`, { body: {} });
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
  // Voorraadreservering (added fase2) - always present on GET responses.
  gereserv: number;
  effectiefGereserv: number;
  swEffectief: boolean;
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
  const data = await request<BonLijnenResponse>("GET", `/bon/${pathSegment(bonnr)}/lijn`);
  return data.items;
}

export type CreateBonPayload = Partial<Omit<BonItem, "bonnr" | "klnr">> & {
  klnr: number;
};

/**
 * Partial update payload for a bon - every field is optional (only fields
 * present are changed) and `bonnr`/`bedrag`/`btw` are deliberately excluded
 * (immutable identifier / server-computed totals, ignored on write even
 * if sent per docs/backend/bon.md's field map).
 */
export type UpdateBonPayload = Partial<
  Omit<BonItem, "bonnr" | "bedrag" | "btw">
>;

/**
 * Updates a bon. Only the fields present in `payload` are changed.
 * Backend: PUT /web/bon/{bonnr} (Luna.Web.BonHandler).
 */
export async function updateBon(
  bonnr: number,
  payload: UpdateBonPayload,
): Promise<BonItem> {
  return request<BonItem>("PUT", `/bon/${pathSegment(bonnr)}`, { body: payload });
}

export type CreateBonLijnPayload = Partial<
  Omit<BonLijnItem, "bonnr" | "lijnnr">
>;

/**
 * Creates a new bon (order/quote confirmation depending on `type`).
 * Backend: POST /web/bon (Luna.Web.BonHandler).
 */
export async function createBon(payload: CreateBonPayload): Promise<BonItem> {
  return request<BonItem>("POST", "/bon", { body: payload });
}

/**
 * Creates a new bonlijn (order line) under an existing bon. `lijnnr` is
 * server-generated (mirrors createOfflijn) - never sent by the client.
 * Backend: POST /web/bon/{bonnr}/lijn (Luna.Web.BonHandler).
 */
export async function createBonLijn(
  bonnr: number,
  payload: CreateBonLijnPayload,
): Promise<BonLijnItem> {
  return request<BonLijnItem>("POST", `/bon/${pathSegment(bonnr)}/lijn`, { body: payload });
}

/**
 * Reserves (positive delta) or releases (negative delta) stock against a
 * bonlijn. Returns the full, updated bonlijn - callers should use the
 * response directly to refresh the UI instead of re-fetching
 * `getBonLijnen`. Client-side callers should hint the valid range
 * `[0, teLeveren - gereserv]` for UX, but the server remains the source of
 * truth for the 400 validation error.
 * Backend: POST /web/bon/{bonnr}/lijn/{lijnnr}/reservering (Luna.Web.BonHandler).
 */
export async function reserveerBonLijn(
  bonnr: number,
  lijnnr: number,
  delta: number,
): Promise<BonLijnItem> {
  return request<BonLijnItem>("POST", `/bon/${pathSegment(bonnr)}/lijn/${pathSegment(lijnnr)}/reservering`, { body: {
    delta,
  } });
}

export type BonLijnProductieItem = {
  bonnr: number;
  blijnnr: number;
  lijnnr: number;
  artnr: string;
  aantal: number;
  gereserv: number;
  effectiefGereserv: number;
  swEffectief: boolean;
  besteld: number;
  omschr: string;
};

type BonLijnProductieResponse = {
  items: BonLijnProductieItem[];
};

/**
 * Productie-sublijnen (bonlijn_productie) for a single bonlijn - the
 * production breakdown of one order line.
 * Backend: GET /web/bon/{bonnr}/lijn/{blijnnr}/productie (Luna.Web.BonHandler).
 */
export async function getBonLijnProductie(
  bonnr: number,
  blijnnr: number,
): Promise<BonLijnProductieItem[]> {
  const data = await request<BonLijnProductieResponse>("GET", `/bon/${pathSegment(bonnr)}/lijn/${pathSegment(blijnnr)}/productie`);
  return data.items;
}

/**
 * Creation payload for a productie-sublijn - `bonnr`/`blijnnr` come from
 * the URL, `lijnnr` is server-assigned.
 */
export type CreateBonLijnProductiePayload = Omit<
  BonLijnProductieItem,
  "bonnr" | "blijnnr" | "lijnnr"
>;

/**
 * Backend: POST /web/bon/{bonnr}/lijn/{blijnnr}/productie (Luna.Web.BonHandler).
 */
export async function createBonLijnProductie(
  bonnr: number,
  blijnnr: number,
  payload: CreateBonLijnProductiePayload,
): Promise<BonLijnProductieItem> {
  return request<BonLijnProductieItem>("POST", `/bon/${pathSegment(bonnr)}/lijn/${pathSegment(blijnnr)}/productie`, { body: payload });
}

/**
 * Partial update payload for a productie-sublijn.
 */
export type UpdateBonLijnProductiePayload = Partial<
  Omit<BonLijnProductieItem, "bonnr" | "blijnnr" | "lijnnr">
>;

/**
 * Backend: PUT /web/bon/{bonnr}/lijn/{blijnnr}/productie/{lijnnr} (Luna.Web.BonHandler).
 */
export async function updateBonLijnProductie(
  bonnr: number,
  blijnnr: number,
  lijnnr: number,
  payload: UpdateBonLijnProductiePayload,
): Promise<BonLijnProductieItem> {
  return request<BonLijnProductieItem>("PUT", `/bon/${pathSegment(bonnr)}/lijn/${pathSegment(blijnnr)}/productie/${pathSegment(lijnnr)}`, { body: payload });
}

/**
 * Deletes a productie-sublijn. Can respond with 409 when the sublijn is
 * already besteld (besteld <> 0) - surfaces the server's exact message via
 * `request`'s standard error handling, no client-side prediction of that
 * rule.
 * Backend: DELETE /web/bon/{bonnr}/lijn/{blijnnr}/productie/{lijnnr} (Luna.Web.BonHandler).
 */
export async function deleteBonLijnProductie(
  bonnr: number,
  blijnnr: number,
  lijnnr: number,
): Promise<{ status: string; lijnnr: number }> {
  return request<{ status: string; lijnnr: number }>("DELETE", `/bon/${pathSegment(bonnr)}/lijn/${pathSegment(blijnnr)}/productie/${pathSegment(lijnnr)}`);
}

/**
 * Which pakbon(nen) a bonlijn is (partially) included in - shown as a
 * small reference block on the bon detail page. Shape not yet confirmed
 * against the live backend - verify field names once the pakbon endpoints
 * are deployed (see handoff note).
 * Backend: GET /web/bon/{bonnr}/lijn/{lijnnr}/pakbonnen (Luna.Web.BonHandler).
 */
export type BonLijnPakbonRef = {
  paknr: number;
  stempel: string;
  datum: string | null;
  afgehaald: boolean;
};

type BonLijnPakbonnenResponse = {
  items: BonLijnPakbonRef[];
};

export async function getBonLijnPakbonnen(
  bonnr: number,
  lijnnr: number,
): Promise<BonLijnPakbonRef[]> {
  const data = await request<BonLijnPakbonnenResponse>("GET", `/bon/${pathSegment(bonnr)}/lijn/${pathSegment(lijnnr)}/pakbonnen`);
  return data.items;
}

export type BonLedItem = {
  bonnr: number;
  groepnr: number;
  ledLijn: number;
  lijnnr: number;
  docLijnnr: number;
  soort: string;
  kode: string;
  artnr: string;
  aantal: number;
  lengte: number;
  lMaat: number;
  rMaat: number;
  switch1: string;
  switch2: string;
  reflector: string;
  prijs: number;
  montagePrijs: number;
  circuit: string;
  comp: string;
  sturing: string;
  opm: string;
  // Verplicht op index 1 - server valideert dit met een 400 als het
  // ontbreekt (zie Backend-contract).
  siktaKleurKodes: string[];
  // Read-only, server-berekend:
  teLeveren: number;
  gereserv: number;
  effectiefGereserv: number;
  swEffectief: boolean;
  besteld: number;
  prebesteld: number;
  voorraad: number;
  levDatum: string | null;
  bestelDatum: string | null;
  montageDatum: string | null;
  controle: boolean;
};

type BonLedResponse = {
  items: BonLedItem[];
};

/**
 * LED-configuratielijnen voor een bon.
 * Backend: GET /web/bon/{bonnr}/led (Luna.Web.BonHandler).
 */
export async function getBonLedLijnen(bonnr: number): Promise<BonLedItem[]> {
  const data = await request<BonLedResponse>("GET", `/bon/${pathSegment(bonnr)}/led`);
  return data.items;
}

/**
 * Creation payload for a LED-configuratielijn - `bonnr`/`lijnnr` are
 * server-assigned (path param + generated), the read-only server-derived
 * fields are omitted. `siktaKleurKodes[1]` is required by the backend
 * (400 if missing) - enforced client-side too for immediate UX feedback,
 * but the server's exact error message is always surfaced if it still
 * occurs.
 */
export type CreateBonLedPayload = Omit<
  BonLedItem,
  | "bonnr"
  | "lijnnr"
  | "teLeveren"
  | "gereserv"
  | "effectiefGereserv"
  | "swEffectief"
  | "besteld"
  | "prebesteld"
  | "voorraad"
  | "levDatum"
  | "bestelDatum"
  | "montageDatum"
  | "controle"
>;

/**
 * Backend: POST /web/bon/{bonnr}/led (Luna.Web.BonHandler). 409 if the
 * gekoppelde bonlijn heeft stempel "D" - surfaced verbatim via request.
 */
export async function createBonLedLijn(
  bonnr: number,
  payload: CreateBonLedPayload,
): Promise<BonLedItem> {
  return request<BonLedItem>("POST", `/bon/${pathSegment(bonnr)}/led`, { body: payload });
}

export type UpdateBonLedPayload = Partial<CreateBonLedPayload>;

/**
 * Backend: PUT /web/bon/{bonnr}/led/{groepnr}/{ledLijn}/{lijnnr} (Luna.Web.BonHandler).
 * Same 400 (siktaKleurKodes[1]) / 409 (stempel "D") rules as create.
 */
export async function updateBonLedLijn(
  bonnr: number,
  groepnr: number,
  ledLijn: number,
  lijnnr: number,
  payload: UpdateBonLedPayload,
): Promise<BonLedItem> {
  return request<BonLedItem>("PUT", `/bon/${pathSegment(bonnr)}/led/${pathSegment(groepnr)}/${pathSegment(ledLijn)}/${pathSegment(lijnnr)}`, { body: payload });
}

/**
 * Backend: DELETE /web/bon/{bonnr}/led/{groepnr}/{ledLijn}/{lijnnr} (Luna.Web.BonHandler).
 */
export async function deleteBonLedLijn(
  bonnr: number,
  groepnr: number,
  ledLijn: number,
  lijnnr: number,
): Promise<{ status: string; lijnnr: number }> {
  return request<{ status: string; lijnnr: number }>("DELETE", `/bon/${pathSegment(bonnr)}/led/${pathSegment(groepnr)}/${pathSegment(ledLijn)}/${pathSegment(lijnnr)}`);
}

export type BonLedQcItem = {
  bonnr: number;
  groepnr: number;
  datum: string | null;
  volgnr: number;
  lijnnr: number;
  omschr: string;
  controle: boolean;
  id: string;
  info: string;
  swInfo: boolean;
};

type BonLedQcResponse = {
  items: BonLedQcItem[];
};

/**
 * QC-registraties voor de LED-configuratie van een bon.
 * Backend: GET /web/bon/{bonnr}/led-qc (Luna.Web.BonHandler).
 */
export async function getBonLedQc(bonnr: number): Promise<BonLedQcItem[]> {
  const data = await request<BonLedQcResponse>("GET", `/bon/${pathSegment(bonnr)}/led-qc`);
  return data.items;
}

export type CreateBonLedQcPayload = Omit<BonLedQcItem, "bonnr" | "volgnr">;

/**
 * Backend: POST /web/bon/{bonnr}/led-qc (Luna.Web.BonHandler).
 */
export async function createBonLedQc(
  bonnr: number,
  payload: CreateBonLedQcPayload,
): Promise<BonLedQcItem> {
  return request<BonLedQcItem>("POST", `/bon/${pathSegment(bonnr)}/led-qc`, { body: payload });
}

export type UpdateBonLedQcPayload = Partial<CreateBonLedQcPayload>;

/**
 * Backend: PUT /web/bon/{bonnr}/led-qc/{groepnr}/{volgnr}/{lijnnr} (Luna.Web.BonHandler).
 */
export async function updateBonLedQc(
  bonnr: number,
  groepnr: number,
  volgnr: number,
  lijnnr: number,
  payload: UpdateBonLedQcPayload,
): Promise<BonLedQcItem> {
  return request<BonLedQcItem>("PUT", `/bon/${pathSegment(bonnr)}/led-qc/${pathSegment(groepnr)}/${pathSegment(volgnr)}/${pathSegment(lijnnr)}`, { body: payload });
}

/**
 * Backend: DELETE /web/bon/{bonnr}/led-qc/{groepnr}/{volgnr}/{lijnnr} (Luna.Web.BonHandler).
 */
export async function deleteBonLedQc(
  bonnr: number,
  groepnr: number,
  volgnr: number,
  lijnnr: number,
): Promise<{ status: string; volgnr: number }> {
  return request<{ status: string; volgnr: number }>("DELETE", `/bon/${pathSegment(bonnr)}/led-qc/${pathSegment(groepnr)}/${pathSegment(volgnr)}/${pathSegment(lijnnr)}`);
}

export type HerstelStempel =
  "ONTVANGST" | "DIAGNOSE" | "OND.BESTELD" | "IN HERSTELLING" | "HERSTELD";

export type BonHerstelItem = {
  bonnr: number;
  artnr: string;
  omschr: string;
  probleem: string;
  facnr: number;
  facDatum: string | null;
  ordnr: number;
  levDatum: string | null;
  bestek: string;
  bestekKosten: number;
  stempel: HerstelStempel;
  herstelling: string;
  datum: string | null;
  refLev: string;
  rapnr: string;
  levnr: number;
  locatie: string;
  herstelDatum: string | null;
  herstelLocatieDatum: string | null;
  technieker: string;
  maxKosten: number;
  garantie: boolean;
  prior: number;
  opmTechn: string;
};

/**
 * Herstel-dossier voor een bon van type "HERSTELLING". Returns `null` when
 * the backend responds with 404 (nog geen herstel-dossier aangemaakt),
 * mirroring the not-found pattern used elsewhere in this client.
 * Backend: GET /web/bon/{bonnr}/herstel (Luna.Web.BonHandler). 409 if
 * bon.type is not "HERSTELLING".
 */
export async function getBonHerstel(
  bonnr: number,
): Promise<BonHerstelItem | null> {
  const path = `/bon/${pathSegment(bonnr)}/herstel`;
  return request<BonHerstelItem>("GET", path, { nullOn404: true });
}

export type CreateBonHerstelPayload = Omit<BonHerstelItem, "bonnr">;

/**
 * Backend: POST /web/bon/{bonnr}/herstel (Luna.Web.BonHandler). 409 if
 * bon.type is not "HERSTELLING".
 */
export async function createBonHerstel(
  bonnr: number,
  payload: CreateBonHerstelPayload,
): Promise<BonHerstelItem> {
  return request<BonHerstelItem>("POST", `/bon/${pathSegment(bonnr)}/herstel`, { body: payload });
}

export type UpdateBonHerstelPayload = Partial<CreateBonHerstelPayload>;

/**
 * Backend: PUT /web/bon/{bonnr}/herstel (Luna.Web.BonHandler).
 */
export async function updateBonHerstel(
  bonnr: number,
  payload: UpdateBonHerstelPayload,
): Promise<BonHerstelItem> {
  return request<BonHerstelItem>("PUT", `/bon/${pathSegment(bonnr)}/herstel`, { body: payload });
}

/**
 * Herstel-workflow transitie-endpoints - geen body nodig, response is het
 * volledige bijgewerkte bon_herstel-record (nieuwe `stempel` + eventuele
 * server-gezette datums). OND.BESTELD -> IN HERSTELLING gebeurt
 * automatisch server-side (geen eigen transitie-knop hiervoor).
 * Backend: POST /web/bon/{bonnr}/herstel/diagnose|bestellen|hersteld
 * (Luna.Web.BonHandler).
 */
export async function bonHerstelNaarDiagnose(
  bonnr: number,
): Promise<BonHerstelItem> {
  return request<BonHerstelItem>("POST", `/bon/${pathSegment(bonnr)}/herstel/diagnose`, { body: {} });
}

export async function bonHerstelOnderdelenBestellen(
  bonnr: number,
): Promise<BonHerstelItem> {
  return request<BonHerstelItem>("POST", `/bon/${pathSegment(bonnr)}/herstel/bestellen`, { body: {} });
}

export async function bonHerstelHersteld(
  bonnr: number,
): Promise<BonHerstelItem> {
  return request<BonHerstelItem>("POST", `/bon/${pathSegment(bonnr)}/herstel/hersteld`, { body: {} });
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
  } = {},
): Promise<BonnenResponse> {
  const { klnr, type, bonnr, naam, page = 1, pageSize = 25 } = params;
  const query = new URLSearchParams();
  if (klnr !== undefined) query.set("klnr", String(klnr));
  if (type !== undefined) query.set("type", type);
  if (bonnr) query.set("bonnr", bonnr);
  if (naam) query.set("naam", naam);
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  return request<BonnenResponse>("GET", `/bon?${query.toString()}`);
}
