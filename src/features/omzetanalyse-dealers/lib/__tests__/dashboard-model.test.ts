import { describe, expect, it } from "vitest";
import {
  buildDashboardModel,
  groepQtyFromCategorie,
  isPerDealerResponse,
  periodeToYearValues,
} from "../dashboard-model";
import {
  gemengdeEenhedenCategorie,
  jarenResponse,
  perDealerJarenResponse,
  perDealerPeriodeResponse,
  periode,
  periodeResponse,
  sectie,
} from "../../test-utils/fixtures";

describe("periodeToYearValues", () => {
  it("coerces null to 0 and derives totaal", () => {
    expect(periodeToYearValues(periode({ omzetLos: 5, omzetProductie: 7 }))).toEqual({
      los: 5,
      productie: 7,
      totaal: 12,
      orders: 0,
    });
    expect(periodeToYearValues(undefined).totaal).toBe(0);
  });
});

describe("buildDashboardModel", () => {
  it("aggregate JAREN: 5 years, growth from API, no dealers", () => {
    const m = buildDashboardModel(jarenResponse);
    expect(isPerDealerResponse(jarenResponse)).toBe(false);
    expect(m.perDealer).toBe(false);
    expect(m.perDealerHint).toBe("geenSoort");
    expect(m.jaren).toHaveLength(5);
    expect(m.jaren[0]).toMatchObject({ key: "2026", isYtd: true });
    expect(m.jaren[1].isYtd).toBe(false);
    expect(m.totaal[0].totaal).toBe(150.5);
    expect(m.totaalGroei).toHaveLength(5);
    expect(m.dealers).toEqual([]);
    expect(m.meters.ledstrip[0]).toBe(7);
  });

  it("per-dealer JAREN: totals are summed from sections", () => {
    const m = buildDashboardModel(perDealerJarenResponse);
    expect(m.perDealer).toBe(true);
    expect(m.perDealerHint).toBe("ok");
    expect(m.dealers).toHaveLength(3);
    expect(m.totaal[0].totaal).toBe(4500);
    expect(m.totaal[1].productie).toBe(2100);
    expect(m.totaal[0].orders).toBe(9); // additive across dealers
    expect(m.totaalGroei).toBeNull();
  });

  it("PERIODE: single column, no growth, period label", () => {
    const m = buildDashboardModel(periodeResponse);
    expect(m.jaren).toHaveLength(1);
    expect(m.jaren[0].label).toBe("01/01/2026 t/m 31/03/2026");
    expect(m.jaren[0].isYtd).toBe(false);
    expect(m.totaalGroei).toBeNull();
    const pd = buildDashboardModel(perDealerPeriodeResponse);
    expect(pd.dealers).toHaveLength(2);
    expect(pd.totaal[0].totaal).toBe(450);
  });

  it("hint is perDealerUit when soort set without perDealer", () => {
    const m = buildDashboardModel({
      ...jarenResponse,
      filters: { ...jarenResponse.filters, soort: "LS" },
    });
    expect(m.perDealerHint).toBe("perDealerUit");
  });

  it("is JSON-serializable", () => {
    const m = buildDashboardModel(perDealerJarenResponse);
    expect(JSON.parse(JSON.stringify(m))).toEqual(m);
  });

  it("does not sum orders across categories in merged groepen", () => {
    const s = sectie(2);
    s.categorieen.push({ ...s.categorieen[0], categorie: "Cover" });
    const m = buildDashboardModel({ ...jarenResponse, kolommen: jarenResponse.kolommen.slice(0, 2), secties: [s] });
    const ls = m.groepen.find((g) => g.categorie === "Ledstrip")!;
    expect(ls.perEenheid.m!.orders[0]).toBe(3);
    expect(m.groepen.map((g) => g.perEenheid.m!.orders[0])).toEqual([3, 3]);
  });
});

describe("groepQtyFromCategorie", () => {
  it("non-gemengd uses totalen and the first non-null eenheid", () => {
    const s = sectie(2);
    const q = groepQtyFromCategorie(s.categorieen[0], 2);
    expect(q.m).toBeDefined();
    expect(q.st).toBeUndefined();
    expect(q.m!.los).toEqual([10.5, 11.5]);
    expect(q.m!.orders).toEqual([3, 3]);
  });

  it("falls back to st when all eenheden are null", () => {
    const c = { ...sectie(1).categorieen[0] };
    c.rijen = [{ ...c.rijen[0], eenheid: null }];
    expect(Object.keys(groepQtyFromCategorie(c, 1))).toEqual(["st"]);
  });

  it("gemengd splits by eenheid and skips null eenheid", () => {
    const q = groepQtyFromCategorie(gemengdeEenhedenCategorie, 2);
    expect(q.m).toEqual({ los: [11, 4], productie: [5, 0], orders: [6, 2] });
    expect(q.st).toEqual({ los: [0, 2], productie: [7, 0], orders: [6, 2] });
  });

  it("pads short arrays with 0", () => {
    const q = groepQtyFromCategorie(gemengdeEenhedenCategorie, 4);
    expect(q.m!.los).toEqual([11, 4, 0, 0]);
    expect(q.m!.orders).toEqual([6, 2, 0, 0]);
  });
});
