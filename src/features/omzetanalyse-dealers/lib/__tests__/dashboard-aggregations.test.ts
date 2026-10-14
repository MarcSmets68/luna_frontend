import { describe, expect, it } from "vitest";
import { buildDashboardModel } from "../dashboard-model";
import {
  activeDealerCount,
  chronological,
  columnTotals,
  computeHero,
  computeMovers,
  dealerDelta,
  dealerDetail,
  dealerRank,
  dealersForTable,
  deltaPct,
  filterDealers,
  mixAvailableUnits,
  mixRows,
  pickValue,
  productieAandeel,
  resolveFocusIndex,
  selectDealers,
  shareSeries,
  sortDealers,
  topNShare,
  topProductieDealers,
  uitvoeringDealerBreakdown,
  uitvoeringRows,
} from "../dashboard-aggregations";
import {
  jarenResponse,
  perDealerJarenResponse,
  perDealerPeriodeResponse,
  periodeResponse,
} from "../../test-utils/fixtures";

const pd = buildDashboardModel(perDealerJarenResponse);

describe("basics", () => {
  it("chronological reverses newest-first without mutating", () => {
    const src = [2026, 2025, 2024];
    expect(chronological(src)).toEqual([2024, 2025, 2026]);
    expect(src).toEqual([2026, 2025, 2024]);
  });

  it("pickValue / productieAandeel / deltaPct", () => {
    const y = { los: 30, productie: 70, totaal: 100, orders: 1 };
    expect(pickValue(y, "los")).toBe(30);
    expect(pickValue(y, "productie")).toBe(70);
    expect(pickValue(y, "totaal")).toBe(100);
    expect(productieAandeel(y)).toBe(0.7);
    expect(productieAandeel({ los: 0, productie: 0, totaal: 0, orders: 0 })).toBeNull();
    expect(deltaPct(150, 100)).toBe(50);
    expect(deltaPct(10, 0)).toBeNull();
  });
});

describe("resolveFocusIndex", () => {
  it("defaults to the last complete year while the first column is the running year", () => {
    expect(resolveFocusIndex(pd)).toBe(1);
  });
  it("defaults to 0 when the first year is not the running year", () => {
    const m = buildDashboardModel({ ...perDealerJarenResponse, generatedAt: "2027-01-02T00:00:00" });
    expect(resolveFocusIndex(m)).toBe(0);
  });
  it("honours a valid focus key, ignores invalid ones, PERIODE is always 0", () => {
    expect(resolveFocusIndex(pd, "2024")).toBe(2);
    expect(resolveFocusIndex(pd, "1999")).toBe(1);
    expect(resolveFocusIndex(buildDashboardModel(periodeResponse), "2024")).toBe(0);
  });
});

describe("computeHero", () => {
  it("per-dealer: delta vs previous column and dealer KPIs", () => {
    const h = computeHero(pd, 1, "totaal");
    expect(h.mode).toBe("jaren");
    if (h.mode !== "jaren") return;
    expect(h.value).toBe(4000);
    expect(h.deltaPct).toBeCloseTo(((4000 - 2100) / 2100) * 100);
    expect(h.prevLabel).toBe("2024");
    expect(h.kpis.map((k) => k.key)).toEqual(["aandeel", "dealers", "gemiddeld", "top3"]);
  });
  it("aggregate: delta from API growth, KPIs include orders and meters", () => {
    const m = buildDashboardModel(jarenResponse);
    const h = computeHero(m, 0, "totaal");
    if (h.mode !== "jaren") throw new Error("mode");
    expect(h.deltaPct).toBe(5);
    expect(h.kpis.map((k) => k.key)).toEqual(["aandeel", "orders", "perOrder", "meters"]);
  });
  it("no delta for the oldest column and PERIODE", () => {
    const old = computeHero(pd, 4, "totaal");
    if (old.mode !== "jaren") throw new Error("mode");
    expect(old.deltaPct).toBeNull();
    expect(old.prevLabel).toBeNull();
    const p = computeHero(buildDashboardModel(perDealerPeriodeResponse), 0, "totaal");
    expect(p.mode).toBe("periode");
  });
  it("delta is null when previous is 0", () => {
    const h = computeHero(pd, 3, "totaal");
    if (h.mode !== "jaren") throw new Error("mode");
    expect(h.deltaPct).toBeNull(); // 2023 (300) vs 2022 (0)
  });
});

describe("dealer helpers", () => {
  it("activeDealerCount / topNShare", () => {
    expect(activeDealerCount(pd.dealers, 1, "totaal")).toBe(3);
    expect(topNShare(pd.dealers, 0, "totaal", 1)).toEqual({ sum: 4000, total: 4500, share: 4000 / 4500 });
    expect(topNShare([], 0, "totaal", 3).share).toBeNull();
  });

  it("filterDealers matches name case-insensitively and klnr", () => {
    expect(filterDealers(pd.dealers, "BETA").map((d) => d.klnr)).toEqual([102]);
    expect(filterDealers(pd.dealers, "103").map((d) => d.klnr)).toEqual([103]);
    expect(filterDealers(pd.dealers, " ")).toHaveLength(4);
  });

  it("dealersForTable hides dealers with zero omzet in every year unless included", () => {
    const o = { query: "", includeZero: false };
    // Gamma has no omzet in 2026 but does in earlier years -> stays visible.
    expect(dealersForTable(pd.dealers, 0, "totaal", o).map((d) => d.klnr)).toEqual([101, 102, 103]);
    expect(dealersForTable(pd.dealers, 0, "totaal", { ...o, includeZero: true }).map((d) => d.klnr)).toEqual([
      101, 102, 103, 104,
    ]);
    expect(dealersForTable(pd.dealers, 0, "totaal", { query: "delta", includeZero: true })).toHaveLength(1);
  });

  it("sortDealers sorts without mutating and is stable on ties", () => {
    const tied = [
      { ...pd.dealers[0], klnr: 1, naam: "A" },
      { ...pd.dealers[0], klnr: 2, naam: "B" },
      { ...pd.dealers[0], klnr: 3, naam: "C" },
    ];
    expect(sortDealers(tied, "focus", "desc", 0, "totaal").map((d) => d.klnr)).toEqual([1, 2, 3]);
    const before = pd.dealers.map((d) => d.klnr);
    expect(sortDealers(pd.dealers, "naam", "desc", 0, "totaal").map((d) => d.klnr)).toEqual([103, 104, 102, 101]);
    expect(sortDealers(pd.dealers, "jaar:3", "asc", 0, "totaal").map((d) => d.klnr)).toEqual([101, 103, 104, 102]);
    expect(pd.dealers.map((d) => d.klnr)).toEqual(before);
  });

  it("sortDealers by delta puts null deltas last in both directions", () => {
    // focus 2024: Alfa and Gamma have prev 0 -> null delta; Beta has a delta
    expect(dealerDelta(pd.dealers[0], 2, "totaal")).toBeNull();
    expect(sortDealers(pd.dealers, "delta", "asc", 2, "totaal")[0].klnr).toBe(102);
    expect(sortDealers(pd.dealers, "delta", "desc", 2, "totaal")[0].klnr).toBe(102);
  });

  it("dealerRank, columnTotals", () => {
    expect(dealerRank(pd.dealers, 101, 0, "totaal")).toBe(1);
    expect(dealerRank(pd.dealers, 102, 0, "totaal")).toBe(2);
    expect(dealerRank(pd.dealers, 103, 0, "totaal")).toBeNull();
    expect(columnTotals(pd.dealers, "totaal", 5)).toEqual([4500, 4000, 2100, 300, 0]);
    expect(columnTotals(pd.dealers, "productie", 2)).toEqual([3000, 2100]);
  });
});

describe("computeMovers", () => {
  it("A->B ranks risers by abs delta", () => {
    const r = computeMovers(pd.dealers, 2, 1, "totaal"); // 2024 -> 2025
    expect(r.risers.map((m) => m.klnr)).toEqual([101, 102, 103]);
    expect(r.risers[0]).toMatchObject({ a: 1600, b: 2800, status: "normaal" });
    expect(r.fallers).toEqual([]);
  });
  it("detects nieuw and weg", () => {
    const r = computeMovers(pd.dealers, 0, 1, "totaal"); // 2026 -> 2025
    expect(r.risers.find((m) => m.klnr === 103)).toMatchObject({ status: "nieuw", pct: null });
    expect(r.fallers.map((m) => m.klnr)).toEqual([101]);
    const w = computeMovers(pd.dealers, 1, 0, "totaal");
    expect(w.fallers.find((m) => m.klnr === 103)!.status).toBe("weg");
    expect(w.summary.nWeg).toBe(1);
    expect(w.summary.nettoDelta).toBe(500);
  });
  it("excludes a=b=0 and honours topN", () => {
    const r = computeMovers(pd.dealers, 4, 3, "totaal", 1);
    expect(r.risers.map((m) => m.klnr)).toEqual([102]);
    expect(r.summary.nRisers).toBe(1);
    expect(computeMovers(pd.dealers, 2, 1, "totaal", 1).risers).toHaveLength(1);
  });
});

describe("selectDealers", () => {
  it("returns the same model when the selection is empty or complete", () => {
    expect(selectDealers(pd, new Set())).toBe(pd);
    expect(selectDealers(pd, new Set([101, 102, 103, 104]))).toBe(pd);
  });

  it("narrows dealers, totals, groepen and artikelen to the picked subset", () => {
    const v = selectDealers(pd, new Set([101]));
    expect(v.dealers.map((d) => d.klnr)).toEqual([101]);
    expect(v.totaal[0]).toMatchObject({ los: 1000, productie: 3000, totaal: 4000 });
    expect(v.totaalGroei).toBeNull();
    // only Alfa's quantities remain in the report-wide lists
    expect(v.groepen).toHaveLength(1);
    expect(v.artikelen.every((a) => a.los[0] === 10.5)).toBe(true);
  });
});

describe("uitvoeringen", () => {
  it("uitvoeringRows falls back to artnr when omschrijving is missing", () => {
    const rows = uitvoeringRows(pd, "m", 0, { query: "" });
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("LS100");
    expect(rows[0].prefix).toBe(true);
    // 3 dealers with artikelen x 10.5m in the focus year
    expect(rows[0].los + rows[0].productie).toBeCloseTo(31.5);
  });

  it("uitvoeringRows groups artikelen with the same omschrijving across categories", () => {
    const m = {
      ...pd,
      artikelen: [
        {
          artnr: "A1",
          omschrijving: "Profiel",
          swBegins: false,
          categorie: "C1",
          eenheid: "m" as const,
          los: [5, 0],
          productie: [0, 0],
        },
        {
          artnr: "A2",
          omschrijving: "Profiel",
          swBegins: false,
          categorie: "C2",
          eenheid: "m" as const,
          los: [7, 0],
          productie: [0, 0],
        },
        {
          artnr: "B1",
          omschrijving: "Kap",
          swBegins: false,
          categorie: "C1",
          eenheid: "m" as const,
          los: [1, 0],
          productie: [0, 0],
        },
      ],
    };
    const rows = uitvoeringRows(m, "m", 0, { query: "" });
    expect(rows.map((r) => r.label)).toEqual(["Profiel", "Kap"]);
    expect(rows[0].los).toBe(12);
  });

  it("uitvoeringDealerBreakdown ranks dealers on the uitvoering quantity", () => {
    const b = uitvoeringDealerBreakdown(pd, "LS100", "m", 0);
    expect(b.shown.map((d) => d.klnr)).toEqual([101, 102, 103]);
    expect(b.rest).toBe(0);
  });
});

describe("share / mix / detail", () => {
  it("shareSeries is chronological and JAREN-only", () => {
    const s = shareSeries(pd);
    expect(s.map((p) => p.label)).toEqual(["2022", "2023", "2024", "2025", "2026"]);
    expect(s[4].share).toBe(3000 / 4500);
    expect(s[0].share).toBeNull();
    expect(shareSeries(buildDashboardModel(perDealerPeriodeResponse))).toEqual([]);
  });

  it("topProductieDealers ranks on productie omzet, share is of own omzet", () => {
    const t = topProductieDealers(pd.dealers, 1, 6);
    expect(t.map((x) => x.klnr)).toEqual([101, 102]);
    // Alfa: 2000 productie of 2800 eigen omzet
    expect(t[0].share).toBeCloseTo(2000 / 2800);
  });

  it("mixRows keeps units separate", () => {
    expect(mixAvailableUnits(pd)).toEqual(["m"]);
    const rows = mixRows(pd, "m", 0, { query: "" });
    expect(rows).toHaveLength(1);
    expect(rows[0].dealersMetQty).toBe(3);
    expect(rows[0].orders).toBe(9); // additive across dealers, one category
    expect(mixRows(pd, "st", 0, { query: "" })).toEqual([]);
    expect(mixRows(pd, "m", 0, { query: "zzz" })).toEqual([]);
  });

  it("dealerDetail", () => {
    const d = dealerDetail(pd, 101, 1, "totaal")!;
    expect(d.rank).toBe(1);
    expect(d.ofTotal).toBe(3);
    expect(d.kpis[0].key).toBe("omzet");
    expect(d.orders).toHaveLength(5);
    expect(dealerDetail(pd, 999, 1, "totaal")).toBeNull();
  });
});
