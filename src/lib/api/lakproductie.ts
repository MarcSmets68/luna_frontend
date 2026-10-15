import { request } from "./http";

export type LakproductieBron =
  "lopende-orders" | "lopende-productielijnen" | "min-max-voorraad";

export type LakproductieStatus =
  "Gereserveerd" | "Deels gereserveerd" | "Besteld" | "Nog te bestellen";

/**
 * Every field is always present; fields that don't apply to a given `bron`
 * are `null` (not omitted) - see Backend contract for GET /web/lakproduktie.
 * `bonnr`/`klant`/`status`/... are only populated for `bron` "lopende-orders"
 * and "lopende-productielijnen" (the "a/b" sources); `bestelAdvies` is only
 * populated for `bron` "min-max-voorraad" (the "c" source); `prodLijnnr` is
 * only populated for "lopende-productielijnen".
 */
export type LakproductieItem = {
  bron: LakproductieBron;
  artnr: string;
  omschrijving: string;
  ledAlu: string;
  behandeling: string;
  kleursoort: string;
  kleurkode: string;
  afwerking: string;
  techniek: string;
  groepeerKleur: string;
  typeAfwerking: string;
  ledType: string;
  ledKenmerk: string;
  lakLevnr: number;
  lakNaam: string;
  voorraad: number;
  gereserveerdVoorraad: number;
  extVoorraad: number;
  extGereserveerd: number;
  voorbewerkingNodig: boolean;
  verpakking: number;
  premontageDatum: string | null;
  verkoop1Maand: number;
  verkoop3Maand: number;
  verkoop6Maand: number;
  verkoop9Maand: number;
  verkoop12Maand: number;
  // a/b only (null for "min-max-voorraad"):
  bonnr: number | null;
  klant: string | null;
  lijnnr: number | null;
  prodLijnnr: number | null;
  groepnr: number | null;
  subgroepnr: number | null;
  aantal: number | null;
  lijnGereserveerd: number | null;
  lijnBesteld: number | null;
  status: LakproductieStatus | null;
  deadline: string | null;
  ordnr: number | null;
  orderLevnr: number | null;
  orderNaam: string | null;
  orderDatum: string | null;
  maatBevestigd: boolean | null;
  kleurOnbepaald: boolean;
  // c only (null for "lopende-orders"/"lopende-productielijnen"):
  bestelAdvies: number | null;
};

type LakproductieResponse = {
  items: LakproductieItem[];
};

/**
 * Open klantorderregels die nog gelakt/geanodiseerd moeten worden en nog
 * niet besteld zijn bij de externe verwerker.
 * Backend: GET /web/lakproduktie (Luna.Web.LakproductieHandler).
 */
export async function getLakproductieItems(): Promise<LakproductieItem[]> {
  const data = await request<LakproductieResponse>("GET", "/lakproduktie");
  return data.items;
}

export type CreateBestellingLine = {
  artnr: string;
  omschrijving: string;
  aantal: number;
  // Link naar de klantorder-lijn deze bestelling-regel bedoeld is voor -
  // weggelaten voor min-max-voorraad-regels (geen klantlink). `volgnr`
  // erbij betekent dat de lijn uit een productielijn (bonlijn_productie)
  // komt i.p.v. rechtstreeks uit een bonlijn.
  bonnr?: number;
  blijnnr?: number;
  volgnr?: number;
};

export type CreateBestellingRequest = {
  levnr: number;
  lines: CreateBestellingLine[];
};

export type BestellingResult = {
  ordnr: number;
  levnr: number;
  naam: string;
  datum: string | null;
  munt: string;
  lines: Array<{
    ordnr: number;
    lijnnr: number;
    artnr: string;
    omschrijving: string;
    aantal: number;
    bonnr: number | null;
    blijnnr: number | null;
    volgnr: number | null;
  }>;
};

/**
 * Creëert een nieuwe inkooporder (`order` + `ordlijn`) vanuit een
 * bevestigde Lakproduktie bestelling-preview. Regels met een
 * bonnr/blijnnr(/volgnr) worden gekoppeld aan de klantorder(-lijn) zodat
 * bij levering duidelijk is voor wie het bedoeld is; regels zonder link
 * zijn zuivere voorraadaanvulling (min-max-voorraad).
 * Backend: POST /web/lakproduktie/bestelling (Luna.Web.LakproductieHandler
 * + Luna.BusinessLogic.LakproductieBestellingBE).
 */
export async function createLakproductieBestelling(
  payload: CreateBestellingRequest,
): Promise<BestellingResult> {
  return request<BestellingResult>("POST", "/lakproduktie/bestelling", { body: payload });
}
