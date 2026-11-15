import type { VerkoopMaand, VerkoopsanalyseResponse, VerkoopsanalyseRij } from "@/lib/api-client";

export const MAANDEN = [
  "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04",
  "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10",
];

export function maanden(f: (i: number) => Omit<VerkoopMaand, "maand">): VerkoopMaand[] {
  return MAANDEN.map((maand, i) => ({ maand, ...f(i) }));
}

export function rij(overrides: Partial<VerkoopsanalyseRij> = {}): VerkoopsanalyseRij {
  return {
    artnr: "NOMALED.FUR01",
    omschrijving: "Furniture profiel",
    swBegins: false,
    eenheid: "st",
    maanden: maanden(() => ({ aantal: 10, omzet: 100, aantalVorigJaar: 5, omzetVorigJaar: 80 })),
    ...overrides,
  };
}

export function response(overrides: Partial<VerkoopsanalyseResponse> = {}): VerkoopsanalyseResponse {
  const rijen = overrides.rijen ?? [rij()];
  const totaal = MAANDEN.map((maand, i) => ({
    maand,
    aantal: rijen.reduce((s, r) => s + r.maanden[i].aantal, 0),
    omzet: rijen.reduce((s, r) => s + r.maanden[i].omzet, 0),
    aantalVorigJaar: rijen.reduce((s, r) => s + r.maanden[i].aantalVorigJaar, 0),
    omzetVorigJaar: rijen.reduce((s, r) => s + r.maanden[i].omzetVorigJaar, 0),
  }));
  return {
    periodeVan: "2025-11-01",
    periodeTot: "2026-10-31",
    vorigePeriodeVan: "2024-11-01",
    vorigePeriodeTot: "2025-10-31",
    dealers: [{ klnr: 1001, naam: "Dealer Antwerpen" }],
    rijen,
    totaal,
    generatedAt: "2026-11-15T08:00:00Z",
    ...overrides,
  };
}
