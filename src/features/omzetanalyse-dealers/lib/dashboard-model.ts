import type {
  OmzetCategorie,
  OmzetPeriode,
  OmzetSectie,
  OmzetanalyseResponse,
} from "@/lib/api-client";
import { buildPeriodeLabel } from "./omzetanalyse-format";
import type {
  DashArtikel,
  DashDealer,
  DashGroep,
  DashboardModel,
  Growth,
  GroepQty,
  QtyUnit,
  YearValues,
} from "./dashboard-types";

const n = (v: number | null | undefined): number => v ?? 0;

function pad(arr: number[], len: number): number[] {
  return Array.from({ length: len }, (_, i) => n(arr[i]));
}

function addInto(target: number[], src: number[]) {
  src.forEach((v, i) => {
    target[i] = (target[i] ?? 0) + v;
  });
}

/** Per-dealer mode = sections carry a dealer klnr. */
export function isPerDealerResponse(r: OmzetanalyseResponse): boolean {
  return r.secties.length > 0 && r.secties.some((s) => s.dealerKlnr !== null);
}

export function periodeToYearValues(p: OmzetPeriode | undefined): YearValues {
  const los = n(p?.omzetLos);
  const productie = n(p?.omzetProductie);
  return {
    los,
    productie,
    totaal: p?.omzetTotaal ?? los + productie,
    orders: n(p?.aantalOrders),
  };
}

function emptyGroepQty(colCount: number): GroepQty {
  const z = () => new Array<number>(colCount).fill(0);
  return { los: z(), productie: z(), orders: z() };
}

/**
 * Quantity per unit for one category (newest first).
 * - Non-mixed: uses totalen[].qtyLos/qtyProductie. The unit is the first
 *   non-null rijen[].eenheid. ASSUMPTION: when every row has eenheid null we
 *   fall back to "st" (pieces) since a unit-less quantity is most likely a count.
 * - Mixed: sums rijen[].perioden[] grouped by rij.eenheid; rows with a null
 *   eenheid are skipped (they cannot be attributed to a unit).
 * `orders` comes from the category totals and is never summed across categories.
 */
export function groepQtyFromCategorie(
  c: OmzetCategorie,
  colCount: number
): Partial<Record<QtyUnit, GroepQty>> {
  const orders = pad(
    c.totalen.map((t) => n(t.aantalOrders)),
    colCount
  );
  if (!c.gemengdeEenheden) {
    const unit: QtyUnit = c.rijen.find((r) => r.eenheid !== null)?.eenheid ?? "st";
    return {
      [unit]: {
        los: pad(c.totalen.map((t) => n(t.qtyLos)), colCount),
        productie: pad(c.totalen.map((t) => n(t.qtyProductie)), colCount),
        orders,
      },
    };
  }
  const out: Partial<Record<QtyUnit, GroepQty>> = {};
  for (const rij of c.rijen) {
    if (!rij.eenheid) continue;
    const g = (out[rij.eenheid] ??= { ...emptyGroepQty(colCount), orders: [...orders] });
    for (let i = 0; i < colCount; i++) {
      g.los[i] += n(rij.perioden[i]?.qtyLos);
      g.productie[i] += n(rij.perioden[i]?.qtyProductie);
    }
  }
  return out;
}

function sectieGroepen(s: OmzetSectie, colCount: number): DashGroep[] {
  return s.categorieen.map((c) => ({
    categorie: c.categorie,
    perEenheid: groepQtyFromCategorie(c, colCount),
  }));
}

function mergeGroepen(lists: DashGroep[][], colCount: number): DashGroep[] {
  const map = new Map<string, DashGroep>();
  for (const list of lists) {
    for (const g of list) {
      const target = map.get(g.categorie) ?? { categorie: g.categorie, perEenheid: {} };
      map.set(g.categorie, target);
      for (const unit of Object.keys(g.perEenheid) as QtyUnit[]) {
        const src = g.perEenheid[unit]!;
        const dst = (target.perEenheid[unit] ??= emptyGroepQty(colCount));
        addInto(dst.los, src.los);
        addInto(dst.productie, src.productie);
        // distinct bonnr: additive across dealers, never across categories
        addInto(dst.orders, src.orders);
      }
    }
  }
  return [...map.values()];
}

function growthFrom(p: OmzetPeriode | undefined): Growth {
  return {
    los: p?.groeiOmzetLos ?? null,
    productie: p?.groeiOmzetProductie ?? null,
    totaal: p?.groeiOmzetTotaal ?? null,
  };
}

export function buildDashboardModel(r: OmzetanalyseResponse): DashboardModel {
  const colCount = r.kolommen.length;
  const perDealer = isPerDealerResponse(r);
  const generatedYear = r.generatedAt.slice(0, 4);

  const jaren =
    r.modus === "PERIODE"
      ? r.kolommen.map((k) => ({
          key: k.key,
          label: buildPeriodeLabel(r.filters.datumVan, r.filters.datumTot),
          isYtd: false,
        }))
      : r.kolommen.map((k, i) => ({ key: k.key, label: k.label, isYtd: i === 0 && k.key === generatedYear }));

  const totaal: YearValues[] = Array.from({ length: colCount }, () => ({
    los: 0,
    productie: 0,
    totaal: 0,
    orders: 0,
  }));
  const ledstrip = new Array<number>(colCount).fill(0);
  const cover = new Array<number>(colCount).fill(0);
  for (const s of r.secties) {
    for (let i = 0; i < colCount; i++) {
      const v = periodeToYearValues(s.omzet[i]);
      totaal[i].los += v.los;
      totaal[i].productie += v.productie;
      totaal[i].totaal += v.totaal;
      totaal[i].orders += v.orders;
    }
    addInto(ledstrip, pad(s.meters.ledstripNomatrack, colCount));
    addInto(cover, pad(s.meters.coverLicht, colCount));
  }

  const dealers: DashDealer[] = perDealer
    ? r.secties
        .filter((s) => s.dealerKlnr !== null)
        .map((s) => ({
          klnr: s.dealerKlnr as number,
          naam: s.dealerNaam ?? String(s.dealerKlnr),
          perJaar: Array.from({ length: colCount }, (_, i) => periodeToYearValues(s.omzet[i])),
          ledstrip: pad(s.meters.ledstripNomatrack, colCount),
          cover: pad(s.meters.coverLicht, colCount),
          groepen: sectieGroepen(s, colCount),
        }))
    : [];

  const groepen = mergeGroepen(
    r.secties.map((s) => sectieGroepen(s, colCount)),
    colCount
  );

  // Articles merged by artnr + categorie (summed across dealers).
  const artMap = new Map<string, DashArtikel>();
  for (const s of r.secties) {
    for (const c of s.categorieen) {
      const catUnit: QtyUnit | null = c.rijen.find((x) => x.eenheid !== null)?.eenheid ?? null;
      for (const rij of c.rijen) {
        const eenheid = rij.eenheid ?? (c.gemengdeEenheden ? null : catUnit);
        const key = `${c.categorie}\u0000${rij.artnr}`;
        const a = artMap.get(key) ?? {
          artnr: rij.artnr,
          swBegins: rij.swBegins,
          categorie: c.categorie,
          eenheid,
          los: new Array<number>(colCount).fill(0),
          productie: new Array<number>(colCount).fill(0),
        };
        artMap.set(key, a);
        for (let i = 0; i < colCount; i++) {
          a.los[i] += n(rij.perioden[i]?.qtyLos);
          a.productie[i] += n(rij.perioden[i]?.qtyProductie);
        }
      }
    }
  }

  const totaalGroei: DashboardModel["totaalGroei"] =
    r.modus === "PERIODE" || r.secties.length === 0 || perDealer
      ? null
      : Array.from({ length: colCount }, (_, i) => growthFrom(r.secties[0].omzet[i]));

  return {
    modus: r.modus,
    jaren,
    perDealer,
    perDealerHint: perDealer ? "ok" : r.filters.soort ? "perDealerUit" : "geenSoort",
    totaal,
    totaalGroei,
    meters: { ledstrip, cover },
    dealers,
    groepen,
    artikelen: [...artMap.values()],
    generatedAt: r.generatedAt,
    filters: r.filters,
  };
}
