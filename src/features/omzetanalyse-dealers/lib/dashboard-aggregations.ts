import { formatInteger, formatQty } from "./omzetanalyse-format";
import type {
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

export function dealersForTable(
  d: DashDealer[],
  focusIdx: number,
  type: OmzetType,
  opts: { query: string; includeZeroInFocus: boolean }
): DashDealer[] {
  const filtered = filterDealers(d, opts.query);
  if (opts.includeZeroInFocus) return filtered;
  return filtered.filter((x) => x.perJaar[focusIdx] && pickValue(x.perJaar[focusIdx], type) > 0);
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

/** Percentile-rank heat level (0 = no value, 1..5) over all positive values. */
export function buildHeatScale(values: number[]): (v: number) => 0 | 1 | 2 | 3 | 4 | 5 {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  return (v) => {
    if (!(v > 0) || sorted.length === 0) return 0;
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    const rank = lo / sorted.length;
    return Math.min(5, 1 + Math.floor(rank * 5)) as 1 | 2 | 3 | 4 | 5;
  };
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
  const total = d.reduce((s, x) => s + (x.perJaar[idx]?.productie ?? 0), 0);
  return d
    .map((x) => ({ klnr: x.klnr, naam: x.naam, productie: x.perJaar[idx]?.productie ?? 0 }))
    .filter((x) => x.productie > 0)
    .sort((a, b) => b.productie - a.productie)
    .slice(0, n)
    .map((x) => ({ ...x, share: total > 0 ? x.productie / total : null }));
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

export function artikelRows(
  m: DashboardModel,
  unit: QtyUnit,
  idx: number,
  opts: { query: string }
): { artnr: string; swBegins: boolean; categorie: string; los: number; productie: number; spark: number[] }[] {
  const q = opts.query.trim().toLowerCase();
  return m.artikelen
    .filter((a) => a.eenheid === unit)
    .filter((a) => sumArr(a.los) + sumArr(a.productie) > 0)
    .filter((a) => !q || a.artnr.toLowerCase().includes(q) || a.categorie.toLowerCase().includes(q))
    .map((a) => ({
      artnr: a.artnr,
      swBegins: a.swBegins,
      categorie: a.categorie,
      los: a.los[idx] ?? 0,
      productie: a.productie[idx] ?? 0,
      spark: chronological(a.los.map((v, i) => v + (a.productie[i] ?? 0))),
    }))
    .sort((a, b) => b.los + b.productie - (a.los + a.productie));
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
  const value = cur ? pickValue(cur, type) : 0;
  const total = m.totaal[focusIdx] ? pickValue(m.totaal[focusIdx], type) : 0;
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
      { key: "aandeel", label: "Aandeel in totaal", value: formatPct(total > 0 ? value / total : null) },
      { key: "productie", label: "Productie-aandeel", value: formatPct(cur ? productieAandeel(cur) : null) },
    ],
    perJaar: d.perJaar,
    topGroepen: topGroepen.slice(0, 8),
    ledstrip: d.ledstrip,
    cover: d.cover,
    orders: d.perJaar.map((y) => y.orders),
  };
}
