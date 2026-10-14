import { DASH, formatGrowth, formatInteger, formatQty } from "./omzetanalyse-format";
import { mergeArtikelen, mergeGroepen } from "./dashboard-model";
import type {
  DashArtikel,
  DashDealer,
  DashboardModel,
  OmzetType,
  QtyUnit,
  YearValues,
} from "./dashboard-types";

/** The ONLY place where newest-first arrays are reversed for display. */
export function chronological<T>(newestFirst: T[]): T[] {
  return [...newestFirst].reverse();
}

export function pickValue(y: YearValues, type: OmzetType): number {
  return type === "los" ? y.los : type === "productie" ? y.productie : y.totaal;
}

export function deltaPct(cur: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((cur - prev) / prev) * 100;
}

export function resolveFocusIndex(m: DashboardModel, focusKey?: string | null): number {
  if (m.modus === "PERIODE") return 0;
  const found = focusKey ? m.jaren.findIndex((j) => j.key === focusKey) : -1;
  if (found >= 0) return found;
  return m.jaren[0]?.isYtd && m.jaren.length > 1 ? 1 : 0;
}

export type HeroKpi = { key: string; label: string; value: string; hint?: string };
export type HeroData =
  | { mode: "periode"; label: string; value: number; kpis: HeroKpi[] }
  | {
      mode: "jaren";
      value: number;
      deltaPct: number | null;
      prevLabel: string | null;
      kpis: HeroKpi[];
    };

export function productieAandeel(y: YearValues): number | null {
  const sum = y.los + y.productie;
  return sum > 0 ? y.productie / sum : null;
}

export function formatPct(share: number | null): string {
  if (share === null) return "\u2014";
  return `${(share * 100).toLocaleString("nl-BE", { maximumFractionDigits: 0 })}\u00A0%`;
}

export function activeDealerCount(dealers: DashDealer[], idx: number, type: OmzetType): number {
  return dealers.filter((d) => d.perJaar[idx] && pickValue(d.perJaar[idx], type) > 0).length;
}

export function topNShare(
  dealers: DashDealer[],
  idx: number,
  type: OmzetType,
  n: number
): { sum: number; total: number; share: number | null } {
  const vals = dealers.map((d) => (d.perJaar[idx] ? pickValue(d.perJaar[idx], type) : 0));
  const total = vals.reduce((a, b) => a + b, 0);
  const sum = [...vals]
    .sort((a, b) => b - a)
    .slice(0, n)
    .reduce((a, b) => a + b, 0);
  return { sum, total, share: total > 0 ? sum / total : null };
}

const euro = (v: number) => `\u20AC\u00A0${formatInteger(v)}`;

export function computeHero(m: DashboardModel, focusIdx: number, type: OmzetType): HeroData {
  const cur = m.totaal[focusIdx] ?? { los: 0, productie: 0, totaal: 0, orders: 0 };
  const value = pickValue(cur, type);
  const kpis: HeroKpi[] = [
    {
      key: "aandeel",
      label: "Productie-aandeel",
      value: formatPct(productieAandeel(cur)),
      hint: "van de omzet",
    },
  ];
  if (m.perDealer) {
    const active = activeDealerCount(m.dealers, focusIdx, type);
    const top3 = topNShare(m.dealers, focusIdx, type, 3);
    kpis.push(
      {
        key: "dealers",
        label: "Dealers met omzet",
        value: formatInteger(active),
        hint: `van ${formatInteger(m.dealers.length)} dealers`,
      },
      {
        key: "gemiddeld",
        label: "Gemiddeld per actieve dealer",
        value: euro(active > 0 ? value / active : 0),
      },
      {
        key: "top3",
        label: "Omzet bij top 3",
        value: formatPct(top3.share),
        hint: "van de totale omzet",
      }
    );
  } else {
    kpis.push(
      { key: "orders", label: "Aantal orders", value: formatInteger(cur.orders) },
      {
        key: "perOrder",
        label: "Omzet per order",
        value: euro(cur.orders > 0 ? value / cur.orders : 0),
      },
      {
        key: "meters",
        label: "Meters",
        value: formatQty((m.meters.ledstrip[focusIdx] ?? 0) + (m.meters.cover[focusIdx] ?? 0)),
        hint: "ledstrip + cover",
      }
    );
  }

  if (m.modus === "PERIODE") {
    return { mode: "periode", label: m.jaren[0]?.label ?? "Periode", value, kpis };
  }
  const prevIdx = focusIdx + 1;
  const hasPrev = prevIdx < m.jaren.length;
  let delta: number | null = null;
  if (hasPrev) {
    if (m.perDealer) {
      delta = deltaPct(value, pickValue(m.totaal[prevIdx], type));
    } else {
      delta = m.totaalGroei?.[focusIdx]?.[type] ?? null;
    }
  }
  return {
    mode: "jaren",
    value,
    deltaPct: delta,
    prevLabel: hasPrev ? m.jaren[prevIdx].label : null,
    kpis,
  };
}

export type DealerSortKey = "naam" | "focus" | "delta" | `jaar:${number}`;

export function filterDealers(d: DashDealer[], query: string): DashDealer[] {
  const q = query.trim().toLowerCase();
  if (!q) return d;
  return d.filter((x) => x.naam.toLowerCase().includes(q) || String(x.klnr).includes(q));
}

export function dealerDelta(d: DashDealer, focusIdx: number, type: OmzetType): number | null {
  const cur = d.perJaar[focusIdx];
  const prev = d.perJaar[focusIdx + 1];
  if (!cur || !prev) return null;
  return deltaPct(pickValue(cur, type), pickValue(prev, type));
}

export function sortDealers(
  d: DashDealer[],
  key: DealerSortKey,
  dir: "asc" | "desc",
  focusIdx: number,
  type: OmzetType
): DashDealer[] {
  const sign = dir === "asc" ? 1 : -1;
  const num = (x: DashDealer): number | null => {
    if (key === "delta") return dealerDelta(x, focusIdx, type);
    const idx = key === "focus" ? focusIdx : Number(String(key).slice(5));
    const y = x.perJaar[idx];
    return y ? pickValue(y, type) : 0;
  };
  return [...d].sort((a, b) => {
    if (key === "naam") return sign * a.naam.localeCompare(b.naam, "nl");
    const va = num(a);
    const vb = num(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1; // nulls always last
    if (vb === null) return -1;
    return sign * (va - vb);
  });
}

/** Dealer has omzet in at least one column (for the chosen omzet type). */
export function dealerHasAnyOmzet(d: DashDealer, type: OmzetType): boolean {
  return d.perJaar.some((y) => pickValue(y, type) !== 0);
}

export function dealersForTable(
  d: DashDealer[],
  focusIdx: number,
  type: OmzetType,
  opts: { query: string; includeZero: boolean }
): DashDealer[] {
  const filtered = filterDealers(d, opts.query);
  if (opts.includeZero) return filtered;
  return filtered.filter((x) => dealerHasAnyOmzet(x, type));
}

/**
 * Client-side dealer selection: narrows the whole model to the picked dealers
 * so every section (hero, chart, movers, share, mix) reflects the subset.
 * Empty set = all dealers. Growth is only available unfiltered.
 */
export function selectDealers(m: DashboardModel, selected: ReadonlySet<number>): DashboardModel {
  if (selected.size === 0) return m;
  const dealers = m.dealers.filter((d) => selected.has(d.klnr));
  if (dealers.length === m.dealers.length) return m;
  const n = m.jaren.length;
  const totaal: YearValues[] = Array.from({ length: n }, () => ({
    los: 0,
    productie: 0,
    totaal: 0,
    orders: 0,
  }));
  const ledstrip = new Array<number>(n).fill(0);
  const cover = new Array<number>(n).fill(0);
  for (const d of dealers) {
    for (let i = 0; i < n; i++) {
      const y = d.perJaar[i];
      if (!y) continue;
      totaal[i].los += y.los;
      totaal[i].productie += y.productie;
      totaal[i].totaal += y.totaal;
      totaal[i].orders += y.orders;
      ledstrip[i] += d.ledstrip[i] ?? 0;
      cover[i] += d.cover[i] ?? 0;
    }
  }
  return {
    ...m,
    dealers,
    totaal,
    totaalGroei: null,
    meters: { ledstrip, cover },
    groepen: mergeGroepen(
      dealers.map((d) => d.groepen),
      n
    ),
    artikelen: mergeArtikelen(dealers.map((d) => d.artikelen)),
  };
}

export function dealerRank(
  d: DashDealer[],
  klnr: number,
  idx: number,
  type: OmzetType
): number | null {
  const me = d.find((x) => x.klnr === klnr);
  if (!me || !me.perJaar[idx]) return null;
  const mine = pickValue(me.perJaar[idx], type);
  if (mine <= 0) return null;
  return (
    1 + d.filter((x) => x.perJaar[idx] && pickValue(x.perJaar[idx], type) > mine).length
  );
}

export function columnTotals(d: DashDealer[], type: OmzetType, colCount: number): number[] {
  return Array.from({ length: colCount }, (_, i) =>
    d.reduce((s, x) => s + (x.perJaar[i] ? pickValue(x.perJaar[i], type) : 0), 0)
  );
}

export type Mover = {
  klnr: number;
  naam: string;
  a: number;
  b: number;
  delta: number;
  pct: number | null;
  status: "nieuw" | "weg" | "normaal";
};
export type MoversResult = {
  risers: Mover[];
  fallers: Mover[];
  summary: { nRisers: number; nFallers: number; nNieuw: number; nWeg: number; nettoDelta: number };
};

export function computeMovers(
  d: DashDealer[],
  aIdx: number,
  bIdx: number,
  type: OmzetType,
  topN = 8
): MoversResult {
  const all: Mover[] = [];
  for (const x of d) {
    const a = x.perJaar[aIdx] ? pickValue(x.perJaar[aIdx], type) : 0;
    const b = x.perJaar[bIdx] ? pickValue(x.perJaar[bIdx], type) : 0;
    if (a === 0 && b === 0) continue;
    all.push({
      klnr: x.klnr,
      naam: x.naam,
      a,
      b,
      delta: b - a,
      pct: a > 0 ? deltaPct(b, a) : null,
      status: a === 0 && b > 0 ? "nieuw" : a > 0 && b === 0 ? "weg" : "normaal",
    });
  }
  const risersAll = all.filter((m) => m.delta > 0).sort((p, q) => q.delta - p.delta);
  const fallersAll = all.filter((m) => m.delta < 0).sort((p, q) => p.delta - q.delta);
  return {
    risers: risersAll.slice(0, topN),
    fallers: fallersAll.slice(0, topN),
    summary: {
      nRisers: risersAll.length,
      nFallers: fallersAll.length,
      nNieuw: all.filter((m) => m.status === "nieuw").length,
      nWeg: all.filter((m) => m.status === "weg").length,
      nettoDelta: all.reduce((s, m) => s + m.delta, 0),
    },
  };
}

export function shareSeries(m: DashboardModel): { label: string; share: number | null }[] {
  if (m.modus !== "JAREN") return [];
  return chronological(m.jaren.map((j, i) => ({ label: j.label, share: productieAandeel(m.totaal[i]) })));
}

export function topProductieDealers(
  d: DashDealer[],
  idx: number,
  n: number
): { klnr: number; naam: string; productie: number; share: number | null }[] {
  return d
    .map((x) => {
      const y = x.perJaar[idx];
      const productie = y?.productie ?? 0;
      const tot = y ? y.los + y.productie : 0;
      return { klnr: x.klnr, naam: x.naam, productie, share: tot > 0 ? productie / tot : null };
    })
    .filter((x) => x.productie > 0)
    .sort((a, b) => b.productie - a.productie)
    .slice(0, n);
}

export type MixRow = {
  categorie: string;
  los: number;
  productie: number;
  total: number;
  orders: number;
  spark: number[];
  dealersMetQty: number | null;
};

const sumArr = (a: number[]) => a.reduce((s, v) => s + v, 0);

export function mixRows(
  m: DashboardModel,
  unit: QtyUnit,
  focusIdx: number,
  opts: { query: string }
): MixRow[] {
  const q = opts.query.trim().toLowerCase();
  const rows: MixRow[] = [];
  for (const g of m.groepen) {
    const qty = g.perEenheid[unit];
    if (!qty) continue;
    if (sumArr(qty.los) + sumArr(qty.productie) <= 0) continue;
    if (q && !g.categorie.toLowerCase().includes(q)) continue;
    const los = qty.los[focusIdx] ?? 0;
    const productie = qty.productie[focusIdx] ?? 0;
    rows.push({
      categorie: g.categorie,
      los,
      productie,
      total: los + productie,
      // orders are per category (distinct bonnr): never summed across rows
      orders: qty.orders[focusIdx] ?? 0,
      spark: chronological(qty.los.map((v, i) => v + (qty.productie[i] ?? 0))),
      dealersMetQty: m.perDealer
        ? m.dealers.filter((d) => {
            const dq = d.groepen.find((x) => x.categorie === g.categorie)?.perEenheid[unit];
            return !!dq && (dq.los[focusIdx] ?? 0) + (dq.productie[focusIdx] ?? 0) > 0;
          }).length
        : null,
    });
  }
  return rows.sort((a, b) => b.total - a.total);
}

export function mixAvailableUnits(m: DashboardModel): QtyUnit[] {
  return (["m", "st"] as QtyUnit[]).filter((u) =>
    m.groepen.some((g) => {
      const q = g.perEenheid[u];
      return !!q && sumArr(q.los) + sumArr(q.productie) > 0;
    })
  );
}

export function groepDealerBreakdown(
  m: DashboardModel,
  categorie: string,
  unit: QtyUnit,
  idx: number
): { shown: { klnr: number; naam: string; los: number; productie: number }[]; rest: number } {
  const list = m.dealers
    .map((d) => {
      const q = d.groepen.find((g) => g.categorie === categorie)?.perEenheid[unit];
      return { klnr: d.klnr, naam: d.naam, los: q?.los[idx] ?? 0, productie: q?.productie[idx] ?? 0 };
    })
    .filter((x) => x.los + x.productie > 0)
    .sort((a, b) => b.los + b.productie - (a.los + a.productie));
  return { shown: list.slice(0, 6), rest: Math.max(0, list.length - 6) };
}

/** Display label for one uitvoering: description when available, else artnr. */
export function uitvoeringLabel(a: DashArtikel): string {
  return a.omschrijving || a.artnr;
}

export type UitvoeringRow = {
  label: string;
  /** SwBegins prefix rows have no omschrijving - mark them like the artikel view. */
  prefix: boolean;
  los: number;
  productie: number;
  spark: number[];
};

/**
 * "Uitvoeringen" view of the product mix: articles grouped by their
 * omschrijving (falling back to artnr for prefix rows), summed across
 * categories - one row per uitvoering, like the reference page.
 */
export function uitvoeringRows(
  m: DashboardModel,
  unit: QtyUnit,
  idx: number,
  opts: { query: string }
): UitvoeringRow[] {
  const q = opts.query.trim().toLowerCase();
  const map = new Map<string, { prefix: boolean; los: number[]; productie: number[] }>();
  for (const a of m.artikelen) {
    if (a.eenheid !== unit) continue;
    if (sumArr(a.los) + sumArr(a.productie) <= 0) continue;
    const label = uitvoeringLabel(a);
    if (q && !label.toLowerCase().includes(q) && !a.artnr.toLowerCase().includes(q)) continue;
    let it = map.get(label);
    if (!it) {
      it = {
        prefix: a.swBegins,
        los: new Array<number>(a.los.length).fill(0),
        productie: new Array<number>(a.productie.length).fill(0),
      };
      map.set(label, it);
    }
    it.prefix = it.prefix && a.swBegins;
    a.los.forEach((v, i) => (it.los[i] += v));
    a.productie.forEach((v, i) => (it.productie[i] += v));
  }
  return [...map.entries()]
    .map(([label, it]) => ({
      label,
      prefix: it.prefix,
      los: it.los[idx] ?? 0,
      productie: it.productie[idx] ?? 0,
      spark: chronological(it.los.map((v, i) => v + (it.productie[i] ?? 0))),
    }))
    .sort((a, b) => b.los + b.productie - (a.los + a.productie));
}

/** Which dealers buy one uitvoering (by label), descending on quantity. */
export function uitvoeringDealerBreakdown(
  m: DashboardModel,
  label: string,
  unit: QtyUnit,
  idx: number
): { shown: { klnr: number; naam: string; qty: number }[]; rest: number } {
  const list = m.dealers
    .map((d) => {
      let qty = 0;
      for (const a of d.artikelen) {
        if (a.eenheid !== unit || uitvoeringLabel(a) !== label) continue;
        qty += (a.los[idx] ?? 0) + (a.productie[idx] ?? 0);
      }
      return { klnr: d.klnr, naam: d.naam, qty };
    })
    .filter((x) => x.qty > 0)
    .sort((a, b) => b.qty - a.qty);
  return { shown: list.slice(0, 6), rest: Math.max(0, list.length - 6) };
}

export type DealerDetail = {
  rank: number | null;
  ofTotal: number;
  kpis: HeroKpi[];
  perJaar: YearValues[];
  topGroepen: { categorie: string; qty: number; unit: QtyUnit }[];
  ledstrip: number[];
  cover: number[];
  orders: number[];
};

export function dealerDetail(
  m: DashboardModel,
  klnr: number,
  focusIdx: number,
  type: OmzetType
): DealerDetail | null {
  const d = m.dealers.find((x) => x.klnr === klnr);
  if (!d) return null;
  const cur = d.perJaar[focusIdx];
  const prev = d.perJaar[focusIdx + 1];
  const value = cur ? pickValue(cur, type) : 0;
  const prevValue = prev ? pickValue(prev, type) : 0;
  const delta = prev ? deltaPct(value, prevValue) : null;
  const topGroepen: DealerDetail["topGroepen"] = [];
  for (const g of d.groepen) {
    for (const unit of Object.keys(g.perEenheid) as QtyUnit[]) {
      const q = g.perEenheid[unit]!;
      const qty = (q.los[focusIdx] ?? 0) + (q.productie[focusIdx] ?? 0);
      if (qty > 0) topGroepen.push({ categorie: g.categorie, qty, unit });
    }
  }
  topGroepen.sort((a, b) => b.qty - a.qty);
  return {
    rank: dealerRank(m.dealers, klnr, focusIdx, type),
    ofTotal: activeDealerCount(m.dealers, focusIdx, type),
    kpis: [
      { key: "omzet", label: "Omzet", value: euro(value) },
      {
        key: "delta",
        label: prev ? `t.o.v. ${m.jaren[focusIdx + 1]?.label ?? "vorig jaar"}` : "t.o.v. vorig jaar",
        value: delta !== null ? formatGrowth(delta) : value > 0 ? "nieuw" : DASH,
      },
      { key: "productie", label: "Productie-aandeel", value: formatPct(cur ? productieAandeel(cur) : null) },
    ],
    perJaar: d.perJaar,
    topGroepen: topGroepen.slice(0, 8),
    ledstrip: d.ledstrip,
    cover: d.cover,
    orders: d.perJaar.map((y) => y.orders),
  };
}
