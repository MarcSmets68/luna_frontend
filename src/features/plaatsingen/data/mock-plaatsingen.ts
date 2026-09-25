import type { PlaatsingItem } from "../types";

/**
 * TEMPORARY mock data - there is no `PlaatsingBE`/`PlaatsingHandler` on the
 * backend yet (see `features/plaatsingen/types.ts`). These functions mirror
 * the shape/signature of the paged `getX(...)`/`getX(id)` helpers in
 * `lib/api-client.ts` (e.g. `getBestelorders`/`getBestelorder`) so that
 * swapping this module out for a real API client call later is a
 * find-and-replace at the call sites, not a rewrite of the page components.
 */
const MOCK_PLAATSINGEN: PlaatsingItem[] = [
  {
    planr: 24001,
    datum: "2026-03-04",
    klnr: 10423,
    klantNaam: "Interieur Van Damme bvba",
    vrtgw: "JVH",
    vrtgwNaam: "Jan Van Herck",
    project: 1042,
    bonnr: 219034,
    factuur: true,
    datumAfsluiting: "2026-04-18",
    naam: "Interieur Van Damme bvba",
    naam1: "",
    adres: "Steenweg op Gent 112",
    postnr: "9300",
    stad: "Aalst",
    land: "BE",
    lnaam: "Showroom Van Damme",
    lnaam1: "",
    ladres: "Nijverheidslaan 8",
    lpostnr: "9300",
    lstad: "Aalst",
    telefoon: "053/12.34.56",
    gsm: "0475/11.22.33",
    gsm2: "",
    email: "info@vandamme-interieur.be",
    email2: "",
    plaatsingswijze: "Aan uurloon",
    plaatsingsdatum: "2026-04-15",
    prijs: 480,
    locatie: "MAG1",
    swVoorbereiding: true,
    voorbereiding: "Stelling meebrengen, plafondhoogte 3,20m.",
    swOpvolging: false,
    opvolging: "",
    opm: "Klant is enkel bereikbaar in de voormiddag.",
    facturatie: "Factureren samen met orderbevestiging 219034.",
    klassementmap: "PLA-2024001",
    werkbonmap: "PLA-2024001\\werkbon",
  },
  {
    planr: 24017,
    datum: "2026-05-22",
    klnr: 10891,
    klantNaam: "Restaurant De Gouden Lepel",
    vrtgw: "MDW",
    vrtgwNaam: "Marc De Wilde",
    project: null,
    bonnr: 220118,
    factuur: false,
    datumAfsluiting: null,
    naam: "Restaurant De Gouden Lepel",
    naam1: "t.a.v. dhr. Peeters",
    adres: "Grote Markt 4",
    postnr: "2000",
    stad: "Antwerpen",
    land: "BE",
    lnaam: "Restaurant De Gouden Lepel",
    lnaam1: "",
    ladres: "Grote Markt 4",
    lpostnr: "2000",
    lstad: "Antwerpen",
    telefoon: "03/22.44.66",
    gsm: "0498/76.54.32",
    gsm2: "",
    email: "peeters@goudenlepel.be",
    email2: "",
    plaatsingswijze: "Gratis",
    plaatsingsdatum: "2026-06-10",
    prijs: 0,
    locatie: "MAG2",
    swVoorbereiding: false,
    voorbereiding: "",
    swOpvolging: true,
    opvolging: "Nabellen begin juni om definitieve datum te bevestigen.",
    opm: "",
    facturatie: "",
    klassementmap: "PLA-2024017",
    werkbonmap: "",
  },
  {
    planr: 24033,
    datum: "2026-06-02",
    klnr: 11250,
    klantNaam: "Kantoren Noordzee nv",
    vrtgw: "JVH",
    vrtgwNaam: "Jan Van Herck",
    project: 1078,
    bonnr: null,
    factuur: false,
    datumAfsluiting: null,
    naam: "Kantoren Noordzee nv",
    naam1: "",
    adres: "Havenlaan 55",
    postnr: "8400",
    stad: "Oostende",
    land: "BE",
    lnaam: "Kantoren Noordzee nv - Verdieping 3",
    lnaam1: "",
    ladres: "Havenlaan 55",
    lpostnr: "8400",
    lstad: "Oostende",
    telefoon: "059/33.44.55",
    gsm: "",
    gsm2: "",
    email: "facility@noordzee-kantoren.be",
    email2: "",
    plaatsingswijze: "",
    plaatsingsdatum: null,
    prijs: 0,
    locatie: "",
    swVoorbereiding: false,
    voorbereiding: "",
    swOpvolging: true,
    opvolging: "Wacht op akkoord bestek vooraleer datum vast te leggen.",
    opm: "Project loopt nog, plaatsing pas na definitieve BOM.",
    facturatie: "",
    klassementmap: "PLA-2024033",
    werkbonmap: "",
  },
];

type GetPlaatsingenParams = {
  page?: number;
  pageSize?: number;
  planr?: string;
  naam?: string;
};

type GetPlaatsingenResult = {
  items: PlaatsingItem[];
  hasMore: boolean;
};

/** Mirrors `getBestelorders`/`getOffertes`: prefix match on `planr`, substring match on klantnaam. */
export async function getMockPlaatsingen(
  params: GetPlaatsingenParams = {}
): Promise<GetPlaatsingenResult> {
  const { page = 1, pageSize = 25, planr, naam } = params;

  const filtered = MOCK_PLAATSINGEN.filter((item) => {
    if (planr && !String(item.planr).startsWith(planr.trim())) return false;
    if (naam && !item.klantNaam.toLowerCase().includes(naam.trim().toLowerCase())) return false;
    return true;
  });

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const hasMore = start + pageSize < filtered.length;

  return { items, hasMore };
}

/** Mirrors `getBestelorder`: returns `null` instead of throwing when not found. */
export async function getMockPlaatsing(planr: number): Promise<PlaatsingItem | null> {
  return MOCK_PLAATSINGEN.find((item) => item.planr === planr) ?? null;
}
