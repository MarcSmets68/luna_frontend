import type {
  OmzetCategorie,
  OmzetPeriode,
  OmzetanalyseFilters,
  OmzetanalyseResponse,
  OmzetSectie,
} from "@/lib/api-client";

export function periode(over: Partial<OmzetPeriode> = {}): OmzetPeriode {
  return {
    qtyLos: null,
    qtyProductie: null,
    aantalOrders: null,
    omzetLos: null,
    omzetProductie: null,
    omzetTotaal: null,
    groeiQtyLos: null,
    groeiQtyProductie: null,
    groeiAantalOrders: null,
    groeiOmzetLos: null,
    groeiOmzetProductie: null,
    groeiOmzetTotaal: null,
    ...over,
  };
}

export const baseFilters: OmzetanalyseFilters = {
  datumVan: null,
  datumTot: null,
  klnr: null,
  klantNaam: null,
  soort: null,
  soortOmschr: null,
  perDealer: false,
  leegRijen: true,
};

/**
 * `omzetPerJaar` (newest first) overrides the per-year omzetTotaal/los/productie
 * of `omzet[]`; dealerKlnr/dealerNaam can be set via `over`.
 */
export function sectie(
  cols: number,
  over: Partial<OmzetSectie> = {},
  gemengd = false,
  omzetPerJaar?: { los: number; productie: number; orders?: number }[]
): OmzetSectie {
  const arr = <T,>(f: (i: number) => T): T[] => Array.from({ length: cols }, (_, i) => f(i));
  return {
    dealerKlnr: null,
    dealerNaam: null,
    categorieen: [
      {
        categorie: "Ledstrip",
        gemengdeEenheden: gemengd,
        rijen: [
          {
            artnr: "LS100",
            swBegins: true,
            eenheid: "m",
            perioden: arr((i) =>
              periode({ qtyLos: 10.5 + i, qtyProductie: null, groeiQtyLos: i === 0 ? 12.34 : null })
            ),
          },
        ],
        totalen: arr((i) =>
          periode({
            qtyLos: 10.5 + i,
            aantalOrders: 3,
            omzetLos: 100.5,
            omzetProductie: 50,
            omzetTotaal: 150.5,
            groeiOmzetTotaal: i === 0 ? -4 : null,
          })
        ),
      },
    ],
    omzet: arr((i) => {
      const o = omzetPerJaar?.[i];
      if (!o) return periode({ aantalOrders: 3, omzetLos: 100.5, omzetProductie: 50, omzetTotaal: 150.5, groeiOmzetTotaal: i === 0 ? 5 : null });
      return periode({
        aantalOrders: o.orders ?? 3,
        omzetLos: o.los,
        omzetProductie: o.productie,
        omzetTotaal: o.los + o.productie,
      });
    }),
    meters: { ledstripNomatrack: arr(() => 7), coverLicht: arr(() => 2.5) },
    ...over,
  };
}

/** PERIODE mode has no growth: null all growth fields. */
function noGrowth(sec: OmzetSectie): OmzetSectie {
  const strip = (p: OmzetPeriode): OmzetPeriode => ({
    ...p,
    groeiQtyLos: null,
    groeiQtyProductie: null,
    groeiAantalOrders: null,
    groeiOmzetLos: null,
    groeiOmzetProductie: null,
    groeiOmzetTotaal: null,
  });
  return {
    ...sec,
    categorieen: sec.categorieen.map((c) => ({
      ...c,
      rijen: c.rijen.map((r) => ({ ...r, perioden: r.perioden.map(strip) })),
      totalen: c.totalen.map(strip),
    })),
    omzet: sec.omzet.map(strip),
  };
}

export const jarenResponse: OmzetanalyseResponse = {
  modus: "JAREN",
  filters: baseFilters,
  kolommen: ["2026", "2025", "2024", "2023", "2022"].map((y) => ({ key: y, label: y })),
  secties: [sectie(5)],
  generatedAt: "2026-09-03T10:00:00",
};

export const periodeResponse: OmzetanalyseResponse = {
  modus: "PERIODE",
  filters: { ...baseFilters, datumVan: "2026-01-01", datumTot: "2026-03-31" },
  kolommen: [{ key: "periode", label: "x" }],
  secties: [noGrowth(sectie(1))],
  generatedAt: "2026-09-03T10:00:00",
};

/** Dealer section helper: per-year (newest first) los/productie omzet. */
export function dealerSectie(
  klnr: number,
  naam: string,
  perJaar: { los: number; productie: number; orders?: number }[]
): OmzetSectie {
  return sectie(perJaar.length, { dealerKlnr: klnr, dealerNaam: naam }, false, perJaar);
}

export const perDealerJarenResponse: OmzetanalyseResponse = {
  modus: "JAREN",
  filters: { ...baseFilters, soort: "LS", soortOmschr: "Lichtstudio", perDealer: true, leegRijen: false },
  kolommen: jarenResponse.kolommen,
  secties: [
    dealerSectie(101, "Alfa Licht", [
      { los: 1000, productie: 3000 },
      { los: 800, productie: 2000 },
      { los: 600, productie: 1000 },
      { los: 0, productie: 0 },
      { los: 0, productie: 0 },
    ]),
    dealerSectie(102, "Beta Verlichting", [
      { los: 500, productie: 0 },
      { los: 900, productie: 100 },
      { los: 400, productie: 0 },
      { los: 300, productie: 0 },
      { los: 0, productie: 0 },
    ]),
    dealerSectie(103, "Gamma Zonder Omzet Nu", [
      { los: 0, productie: 0 },
      { los: 200, productie: 0 },
      { los: 100, productie: 0 },
      { los: 0, productie: 0 },
      { los: 0, productie: 0 },
    ]),
  ],
  generatedAt: "2026-09-03T10:00:00",
};

export const perDealerPeriodeResponse: OmzetanalyseResponse = {
  modus: "PERIODE",
  filters: {
    ...baseFilters,
    datumVan: "2026-01-01",
    datumTot: "2026-03-31",
    soort: "LS",
    perDealer: true,
    leegRijen: false,
  },
  kolommen: [{ key: "periode", label: "x" }],
  secties: [
    noGrowth(dealerSectie(101, "Alfa Licht", [{ los: 100, productie: 300, orders: 4 }])),
    noGrowth(dealerSectie(102, "Beta Verlichting", [{ los: 50, productie: 0, orders: 2 }])),
  ],
  generatedAt: "2026-09-03T10:00:00",
};

/** Category with mixed units: meters and pieces in one category (newest first, 2 cols). */
export const gemengdeEenhedenCategorie: OmzetCategorie = {
  categorie: "Mix",
  gemengdeEenheden: true,
  rijen: [
    { artnr: "M1", swBegins: false, eenheid: "m", perioden: [periode({ qtyLos: 10, qtyProductie: 5 }), periode({ qtyLos: 4 })] },
    { artnr: "M2", swBegins: false, eenheid: "m", perioden: [periode({ qtyLos: 1 }), periode()] },
    { artnr: "S1", swBegins: true, eenheid: "st", perioden: [periode({ qtyProductie: 7 }), periode({ qtyLos: 2 })] },
    { artnr: "X1", swBegins: false, eenheid: null, perioden: [periode({ qtyLos: 99 }), periode({ qtyLos: 99 })] },
  ],
  totalen: [periode({ aantalOrders: 6 }), periode({ aantalOrders: 2 })],
};
