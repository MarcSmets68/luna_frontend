import type { OmzetanalyseFilters } from "@/lib/api-client";

// Slim, fully JSON-serializable model passed from the server component into
// the client dashboard tree. All arrays are NEWEST FIRST (index 0 = current /
// running year), exactly like the API; use chronological() for display.

export type OmzetType = "totaal" | "los" | "productie";
export type QtyUnit = "m" | "st";
export type DashJaar = { key: string; label: string; isYtd: boolean };
export type YearValues = { los: number; productie: number; totaal: number; orders: number };
export type Growth = { los: number | null; productie: number | null; totaal: number | null };
export type GroepQty = { los: number[]; productie: number[]; orders: number[] };
export type DashGroep = { categorie: string; perEenheid: Partial<Record<QtyUnit, GroepQty>> };
export type DashDealer = {
  klnr: number;
  naam: string;
  perJaar: YearValues[];
  ledstrip: number[];
  cover: number[];
  groepen: DashGroep[];
};
export type DashArtikel = {
  artnr: string;
  swBegins: boolean;
  categorie: string;
  eenheid: QtyUnit | null;
  los: number[];
  productie: number[];
};
export type DashboardModel = {
  modus: "JAREN" | "PERIODE";
  jaren: DashJaar[];
  perDealer: boolean;
  perDealerHint: "ok" | "geenSoort" | "perDealerUit";
  totaal: YearValues[];
  totaalGroei: Growth[] | null;
  meters: { ledstrip: number[]; cover: number[] };
  dealers: DashDealer[];
  groepen: DashGroep[];
  artikelen: DashArtikel[];
  generatedAt: string;
  filters: OmzetanalyseFilters;
};
