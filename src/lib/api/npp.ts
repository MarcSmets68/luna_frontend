import { request, pathSegment } from "./http";

export type BoxOverzichtArticle = {
  artnr: string;
  omschrijving: string;
  aantal: number;
  // May be "" - callers must not render a barcode graphic when empty
  // (see BoxLabelPrintView).
  barcode: string;
};

export type BoxOverzichtResult = {
  bonnr: number;
  groepnr: number;
  klant: string;
  // "niets" is a normal literal opmerking value, not a special case.
  opmerking: string;
  // true = box/groepnr has no matching lines - callers must branch on
  // this field, not on articles.length.
  empty: boolean;
  articles: BoxOverzichtArticle[];
};

/**
 * NPP "Boxoverzicht" tile: looks up the bon/groep for a scanned box label
 * (raw scanned string, e.g. "B12345-1" or "12345-1") and returns the
 * articles packed in that box. Errors ("Ontbrekende parameter 'scan'",
 * "Onbekend boxlabel", "Bon niet gevonden") are surfaced verbatim via
 * request's error-envelope handling.
 * Backend: GET /web/npp/boxoverzicht (Luna.Web.NppBoxoverzichtHandler).
 */
export async function getBoxOverzicht(
  scan: string,
): Promise<BoxOverzichtResult> {
  return request<BoxOverzichtResult>("GET", `/npp/boxoverzicht?scan=${encodeURIComponent(scan)}`);
}

export type NppReservatieMode = "direct" | "productie";

export type EffectiefStatus =
  | "niet_effectief"
  | "gedeeltelijk_effectief"
  | "geen_effectief"
  | "volledig_effectief";

export interface NppReservatieQueueItem {
  bonnr: number;
  groepnr: number;
  datum: string | null;
  levDatum: string | null;
  naam: string;
  plaatsingWijze: string;
  transport: string;
  stempel: string;
  lockId: string;
  dringend: boolean;
  swReservatie: boolean;
  swProductie: boolean;
  swNomaled: boolean;
  verwijderd: boolean;
  deleteOpm: string | null;
}

export interface NppReservatieQueue {
  mode: NppReservatieMode;
  dringendDagen: number;
  items: NppReservatieQueueItem[];
}

export interface NppReservatieDetailItem {
  lijnnr: number;
  groepnr: number;
  artnr: string;
  omschrijving: string;
  teLeveren: number;
  gereserv: number;
  effectiefGereserv: number;
  swEffectief: boolean;
  effectiefStatus: EffectiefStatus | null;
  kolomtitel: boolean;
  infolijn: boolean;
  subtotaal: boolean;
}

export interface NppReservatieDetail {
  bonnr: number;
  groepnr: number;
  nBedrag: number;
  items: NppReservatieDetailItem[];
}

/**
 * NPP "Reservaties raadplegen" tile: read-only queue of bons for the given
 * mode (direct or productie). Requires a session like every other call
 * (the browser proxy answers 401 without the token cookie).
 * Backend: GET /web/npp/reservaties?mode=... (Luna.Web.NppReservatiesHandler).
 */
export async function getNppReservatieQueue(
  mode: NppReservatieMode,
): Promise<NppReservatieQueue> {
  return request<NppReservatieQueue>("GET", `/npp/reservaties?mode=${encodeURIComponent(mode)}`);
}

/**
 * Read-only reservation detail for one bon. `groepnr` is only sent when
 * provided and non-zero. 404 when the bon isn't found (message surfaced
 * verbatim by request).
 * Backend: GET /web/npp/reservaties/{bonnr}?groepnr=...
 */
export async function getNppReservatieDetail(
  bonnr: number,
  groepnr?: number,
): Promise<NppReservatieDetail> {
  const qs = groepnr ? `?groepnr=${encodeURIComponent(String(groepnr))}` : "";
  return request<NppReservatieDetail>("GET", `/npp/reservaties/${pathSegment(bonnr)}${qs}`);
}

export type PlanningQueueItem = {
  bonnr: number;
  groepnr: number;
  lijnnr: number;
  klant: string;
  artnr: string;
  omschrijving: string;
  aantal: number;
  levDatum: string | null; // "YYYY-MM-DD" or null
};

/**
 * Production queue for the NPP "Planning raadplegen" tile, already sorted
 * by the backend (levDatum ascending, nulls last). Requires a session like
 * every other call (the browser proxy answers 401 without the token cookie).
 * Backend: GET /web/npp/planning.
 */
export async function getPlanningQueue(): Promise<{ items: PlanningQueueItem[] }> {
  return request<{ items: PlanningQueueItem[] }>("GET", "/npp/planning");
}

export type ArtikelScanArticle = {
  artnr: string;
  nummer: number;
  xref: string;
  omschrijving: string;
  barcode: string;
  pickingkode: string;
  pickingkleur: string;
  // Present only when resolved via the nummer-aantal ("<nummer>-<aantal>")
  // scan form.
  aantal?: number;
};

export type ArtikelScanCandidate = { artnr: string; omschrijving: string };

export type ArtikelScanResult = {
  status: "resolved" | "not_found" | "multiple";
  scan: string;
  article: ArtikelScanArticle | null;
  empty: boolean;
  // Only present when status === "multiple".
  candidates?: ArtikelScanCandidate[];
  // Only present when the caller passed expectedArtnr - not used by the
  // NPP "Scannen / verifiëren" tile.
  match?: boolean;
};

/**
 * NPP "Scannen / verifiëren" tile: resolves a scanned artikel value
 * (barcode, artnr, xref, or the "<nummer>-<aantal>" picking form) to the
 * matching artikel. `status` branches the caller's rendering: "resolved"
 * (one match, `article` populated), "not_found" (no match), "multiple"
 * (ambiguous match, see `candidates`). Pass `expectedArtnr` to also verify
 * the scan against a known artnr (`match` in the response) - not used by
 * this tile yet.
 * Backend: GET /web/npp/artikelscan (Luna.Web.NppArtikelscanHandler).
 */
export async function getArtikelScan(
  scan: string,
  expectedArtnr?: string,
): Promise<ArtikelScanResult> {
  const qs = expectedArtnr
    ? `scan=${encodeURIComponent(scan)}&expectedArtnr=${encodeURIComponent(expectedArtnr)}`
    : `scan=${encodeURIComponent(scan)}`;
  return request<ArtikelScanResult>("GET", `/npp/artikelscan?${qs}`);
}

export type StockBewegingMovementType =
  | "correctie_plus"
  | "correctie_min"
  | "correctie_gelijk"
  | "ontvangst"
  | "transfer_extern"
  | "transfer_intern";

/**
 * `aantal`/`opm` are required for every movementType except
 * "transfer_intern" (opm auto-generated server-side for that one);
 * `nieuwMagazijn` is required only for "transfer_intern". See
 * NPP "Stockbeweging boeken" contract.
 */
export type StockBewegingPayload = {
  artnr: string;
  movementType: StockBewegingMovementType;
  aantal?: number;
  opm?: string;
  nieuwMagazijn?: string;
};

export type StockBewegingResult = {
  artikel: { artnr: string; voorraad: number; magazijn: string };
  artlog: {
    artnr: string;
    lijnnr: number;
    datum: string;
    uur: string;
    beweging: string;
    aantal: number;
    stock: number;
    opm: string;
    id: string;
  };
};

/**
 * NPP "Stockbeweging boeken" tile: books a stock movement for an already
 * resolved artikel. Requires a logged-in session: the token is added
 * from the httpOnly cookie as the "X-Auth-Token" header (PASOE/Tomcat
 * intercepts a standard "Authorization" header before it reaches the
 * WebHandler). Error statuses (400/401/404/409) are surfaced verbatim by
 * request's error-envelope handling - do not reinterpret those messages.
 * Backend: POST /web/npp/stockbeweging (Luna.Web.NppStockbewegingHandler).
 */
export async function postStockBeweging(
  payload: StockBewegingPayload,
): Promise<StockBewegingResult> {
  return request<StockBewegingResult>("POST", "/npp/stockbeweging", { body: payload });
}

export type QcItemState = "Te controleren" | "OK" | "N.v.t." | "Fout";

export type QcChecklistItem = {
  lijnnr: number;
  omschr: string;
  swInfo: boolean;
  controle: QcItemState;
  info: string;
};

export type QcQueueItem = {
  bonnr: number;
  groepnr: number;
  lijnnr: number;
  klant: string;
  profielgroep: string;
  montageDatum: string | null;
  hasInProgressSession: boolean;
  inProgressByOther: boolean;
};

export type QcSession = {
  bonnr: number;
  groepnr: number;
  volgnr: number;
  datum: string;
  resumed?: boolean;
  items: QcChecklistItem[];
};

export type QcAnswerResult = {
  item: QcChecklistItem;
  sessionComplete: boolean;
  outcome?: "approved";
};

type QcQueueResponse = { items: QcQueueItem[] };

/**
 * NPP "Kwaliteitscontrole" tile: queue of bon/groep combinations eligible
 * for QC. `hasInProgressSession`/`inProgressByOther` drive the
 * "Hervatten" / "In bewerking door X" row treatment - see
 * queue-list-item.tsx. Requires a logged-in session (token added from the
 * httpOnly cookie as "X-Auth-Token", same as postStockBeweging).
 * Backend: GET /web/npp/kwaliteitscontrole/queue
 * (Luna.Web.NppKwaliteitscontroleHandler).
 */
export async function getKwaliteitscontroleQueue(): Promise<{ items: QcQueueItem[] }> {
  return request<QcQueueResponse>("GET", "/npp/kwaliteitscontrole/queue");
}

/**
 * Starts (or resumes, if one is already open for this operator) a QC
 * session for a bon/groep. Errors are surfaced verbatim: 403 (self-QC
 * guard - operator cannot QC their own work), 404 (not eligible for QC),
 * 409 (already in progress by someone else - message includes their id).
 * Backend: POST /web/npp/kwaliteitscontrole/{bonnr}/{groepnr}/session
 * (Luna.Web.NppKwaliteitscontroleHandler).
 */
export async function startKwaliteitscontroleSession(
  bonnr: number,
  groepnr: number,
): Promise<QcSession> {
  return request<QcSession>("POST", `/npp/kwaliteitscontrole/${pathSegment(bonnr)}/${pathSegment(groepnr)}/session`, { body: {} });
}

/**
 * Reads the currently open QC session for a bon/groep, if any (404 if
 * none open - not swallowed here, callers get the thrown error like any
 * other request call).
 * Backend: GET /web/npp/kwaliteitscontrole/{bonnr}/{groepnr}/session
 * (Luna.Web.NppKwaliteitscontroleHandler).
 */
export async function getKwaliteitscontroleSession(
  bonnr: number,
  groepnr: number,
): Promise<QcSession> {
  return request<QcSession>("GET", `/npp/kwaliteitscontrole/${pathSegment(bonnr)}/${pathSegment(groepnr)}/session`);
}

/**
 * Answers a single checklist item within an open session. `info` is
 * required by the backend when the item's `swInfo` is true and
 * `controle` is "OK" (400 otherwise) - callers must collect it before
 * calling this. 404/409 indicate a stale session (someone else closed
 * it, or the volgnr no longer matches) - surfaced verbatim.
 * Backend: PUT
 * /web/npp/kwaliteitscontrole/{bonnr}/{groepnr}/{volgnr}/items/{lijnnr}
 * (Luna.Web.NppKwaliteitscontroleHandler).
 */
export async function answerKwaliteitscontroleItem(
  bonnr: number,
  groepnr: number,
  volgnr: number,
  lijnnr: number,
  payload: { controle: Exclude<QcItemState, "Te controleren">; info?: string },
): Promise<QcAnswerResult> {
  return request<QcAnswerResult>("PUT", `/npp/kwaliteitscontrole/${pathSegment(bonnr)}/${pathSegment(groepnr)}/${pathSegment(volgnr)}/items/${pathSegment(lijnnr)}`, { body: payload });
}

/**
 * Rejects (afkeurt) the whole QC session with a mandatory remark - the
 * only way out of a checklist besides completing every item. 400 on a
 * blank opmerking; 404/409 on a stale session.
 * Backend: POST
 * /web/npp/kwaliteitscontrole/{bonnr}/{groepnr}/{volgnr}/afkeur
 * (Luna.Web.NppKwaliteitscontroleHandler).
 */
export async function rejectKwaliteitscontrole(
  bonnr: number,
  groepnr: number,
  volgnr: number,
  payload: { opmerking: string },
): Promise<{
  outcome: "rejected";
  bonnr: number;
  groepnr: number;
  volgnr: number;
}> {
  return request<{
    outcome: "rejected";
    bonnr: number;
    groepnr: number;
    volgnr: number;
  }>("POST", `/npp/kwaliteitscontrole/${pathSegment(bonnr)}/${pathSegment(groepnr)}/${pathSegment(volgnr)}/afkeur`, { body: payload });
}
