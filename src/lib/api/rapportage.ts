import { request } from "./http";

export type VerkoopFurItem = {
  klnr: number;
  naam: string;
  aantalFurOrders: number;
  totaalAantalStuks: number;
  laatsteBesteldatum: string; // ISO date "YYYY-MM-DD"
};

export type VerkoopFurResponse = {
  items: VerkoopFurItem[];
  periodeVan: string; // ISO date
  periodeTot: string; // ISO date
  generatedAt: string; // ISO datetime
};

/**
 * Rolling-12-months overzicht van dealers met NOMALED.FUR*-orderregels,
 * gesorteerd server-side descending op totaalAantalStuks (Marc-bevestigd,
 * zie docs/architecture/verkoop-fur-ontwerp.md Open flags #3) - geen
 * query-params, geen paginatie (dealer-lijst is klein).
 * Backend: GET /web/rapportage/verkoop-fur (Luna.Web.RapportageHandler +
 * Luna.BusinessLogic.VerkoopFurBE).
 */
export async function getVerkoopFurOverzicht(): Promise<VerkoopFurResponse> {
  return request<VerkoopFurResponse>("GET", "/rapportage/verkoop-fur");
}

export type OmzetPeriode = {
  qtyLos: number | null;
  qtyProductie: number | null;
  aantalOrders: number | null;
  omzetLos: number | null;
  omzetProductie: number | null;
  omzetTotaal: number | null;
  groeiQtyLos: number | null;
  groeiQtyProductie: number | null;
  groeiAantalOrders: number | null;
  groeiOmzetLos: number | null;
  groeiOmzetProductie: number | null;
  groeiOmzetTotaal: number | null;
};

export type OmzetRij = {
  artnr: string;
  /** artikel.omschr-n for exact-match rows; absent/null on older backends and
      for swBegins prefix rows and the Nomacurve spec. */
  omschrijving?: string | null;
  swBegins: boolean;
  eenheid: "m" | "st" | null;
  perioden: OmzetPeriode[];
};

export type OmzetCategorie = {
  categorie: string;
  gemengdeEenheden: boolean;
  rijen: OmzetRij[];
  totalen: OmzetPeriode[];
};

export type OmzetMeters = { ledstripNomatrack: number[]; coverLicht: number[] };

export type OmzetSectie = {
  dealerKlnr: number | null;
  dealerNaam: string | null;
  categorieen: OmzetCategorie[];
  omzet: OmzetPeriode[];
  meters: OmzetMeters;
};

export type OmzetanalyseFilters = {
  datumVan: string | null;
  datumTot: string | null;
  klnr: number | null;
  klantNaam: string | null;
  soort: string | null;
  soortOmschr: string | null;
  perDealer: boolean;
  leegRijen: boolean;
  /** Absent on backends predating the dashboard-gaps branch. */
  inclusiefZonderOmzet?: boolean;
};

export type OmzetanalyseResponse = {
  modus: "JAREN" | "PERIODE";
  filters: OmzetanalyseFilters;
  kolommen: { key: string; label: string }[];
  secties: OmzetSectie[];
  generatedAt: string;
};

export type SoortItem = { kode: string; omschr: string };

export type OmzetanalyseParams = {
  datumVan?: string;
  datumTot?: string;
  klnr?: number;
  soort?: string;
  perDealer?: boolean;
  inclusiefZonderOmzet?: boolean;
};

/**
 * Omzetanalyse dealers (Rapportage). Optional filters are omitted when
 * empty. `leegRijen` is derived: always `false` in per-dealer mode, else
 * `true`. Cached for 5min (`next.revalidate`): the backend query takes
 * ~20s, and the analysis only changes when orders are booked - repeat
 * visits should be instant. The rapportage landing page warms this cache.
 * Backend: GET /web/rapportage/omzetanalyse-dealers.
 */
export async function getOmzetanalyseDealers(
  params: OmzetanalyseParams = {}
): Promise<OmzetanalyseResponse> {
  const { datumVan, datumTot, klnr, soort, perDealer = false, inclusiefZonderOmzet = false } = params;
  const query = new URLSearchParams();
  // Backwards compatibility: the backend query parser only treats "&" as a
  // separator when followed by a KNOWN param name (QueryParamHelper anchors).
  // Backends predating inclusiefZonderOmzet would otherwise glue it onto the
  // previous value and return 400 - as the FIRST param it is simply ignored.
  if (inclusiefZonderOmzet) query.set("inclusiefZonderOmzet", "true");
  if (datumVan) query.set("datumVan", datumVan);
  if (datumTot) query.set("datumTot", datumTot);
  if (klnr !== undefined) query.set("klnr", String(klnr));
  if (soort) query.set("soort", soort);
  if (perDealer) query.set("perDealer", "true");
  query.set("leegRijen", String(!perDealer));
  const path = `/rapportage/omzetanalyse-dealers?${query.toString()}`;

  return request<OmzetanalyseResponse>("GET", path, { next: { revalidate: 300 } });
}

/** Soort-dropdown items for the Omzetanalyse dealers filter form. */
export async function getOmzetanalyseSoorten(): Promise<{ items: SoortItem[] }> {
  return request<{ items: SoortItem[] }>("GET", "/rapportage/omzetanalyse-dealers/soorten");
}
