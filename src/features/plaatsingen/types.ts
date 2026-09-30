/**
 * Shape of a "plaatsing" (on-site installation appointment), modeled on the
 * legacy `plaatsing` table / `Plaatsing.w` screen (see
 * `docs/legacy-codebase-guide.md` §6 "Project & Plaatsing Domain").
 *
 * NOTE: there is no backend Business Entity/WebHandler for this domain yet
 * (PRD "CRM - partners" / cross-cutting project tracking, Fase 6) - this
 * type currently backs `features/plaatsingen/data/mock-plaatsingen.ts`
 * mock data only, not a real `/web/plaatsing` endpoint. Once a
 * `PlaatsingBE`/`PlaatsingHandler` exists (via the analyst/architect/
 * backend-coder pipeline per `AGENTS.md`), this type should move to
 * `lib/api-client.ts` and be reconciled with the actual API contract.
 */
export type PlaatsingItem = {
  planr: number;
  datum: string;
  klnr: number;
  klantNaam: string;
  vrtgw: string;
  vrtgwNaam: string;
  project: number | null;
  bonnr: number | null;
  factuur: boolean;
  datumAfsluiting: string | null;

  /** Factuuradres - snapshot fields stored on `plaatsing` itself, not a live join to `klant`. */
  naam: string;
  naam1: string;
  adres: string;
  postnr: string;
  stad: string;
  land: string;

  /** Plaatsingsadres (site address) - can differ from the factuuradres above. */
  lnaam: string;
  lnaam1: string;
  ladres: string;
  lpostnr: string;
  lstad: string;

  telefoon: string;
  gsm: string;
  gsm2: string;
  email: string;
  email2: string;

  plaatsingswijze: "Gratis" | "Aan uurloon" | "";
  plaatsingsdatum: string | null;
  prijs: number;
  locatie: string;

  swVoorbereiding: boolean;
  voorbereiding: string;
  swOpvolging: boolean;
  opvolging: string;

  opm: string;
  facturatie: string;

  klassementmap: string;
  werkbonmap: string;
};
