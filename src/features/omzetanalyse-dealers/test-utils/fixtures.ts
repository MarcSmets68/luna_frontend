import type {
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

export function sectie(
  cols: number,
  over: Partial<OmzetSectie> = {},
  gemengd = false
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
    omzet: arr(() => periode({ aantalOrders: 3, omzetLos: 100.5, omzetProductie: 50, omzetTotaal: 150.5 })),
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
