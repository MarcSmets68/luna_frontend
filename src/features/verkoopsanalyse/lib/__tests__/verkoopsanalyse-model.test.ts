import { describe, expect, it } from "vitest";
import {
  buildSelectieQuery,
  groei,
  heeftGemengdeEenheden,
  maandLabel,
  parseSelectie,
  sommeer,
  totaalAantalZinvol,
  vorigJaarLabel,
} from "../verkoopsanalyse-model";
import { maanden, rij } from "../../test-utils/fixtures";

describe("parseSelectie / buildSelectieQuery", () => {
  it("parses dealers and artikelen, dropping junk and duplicates", () => {
    expect(
      parseSelectie({ dealers: "12, 34,abc,12,-3", artikelen: "A1| a1 |NOMALED.FUR*||*" }),
    ).toEqual({ klnrs: [12, 34], artikelen: ["A1", "NOMALED.FUR*"] });
  });

  it("returns an empty selection without params", () => {
    expect(parseSelectie({})).toEqual({ klnrs: [], artikelen: [] });
  });

  it("round-trips through the query string, including spaces and %", () => {
    const selectie = { klnrs: [5, 7], artikelen: ["100%.511 WW", "NOMA*"] };
    const sp = Object.fromEntries(new URLSearchParams(buildSelectieQuery(selectie)));
    expect(sp.toon).toBe("1");
    expect(parseSelectie(sp)).toEqual(selectie);
  });
});

describe("groei", () => {
  it("computes the growth in percent", () => {
    expect(groei(120, 100)).toBeCloseTo(20);
    expect(groei(50, 100)).toBeCloseTo(-50);
  });

  it("returns null when last year is zero", () => {
    expect(groei(10, 0)).toBeNull();
  });
});

describe("sommeer", () => {
  it("sums all months", () => {
    const t = sommeer(maanden((i) => ({ aantal: i, omzet: 10, aantalVorigJaar: 1, omzetVorigJaar: 5 })));
    expect(t).toEqual({ aantal: 66, omzet: 120, aantalVorigJaar: 12, omzetVorigJaar: 60 });
  });
});

describe("heeftGemengdeEenheden", () => {
  it("detects meters mixed with stuks", () => {
    expect(heeftGemengdeEenheden([rij({ eenheid: "m" }), rij({ eenheid: "st" })])).toBe(true);
    expect(heeftGemengdeEenheden([rij({ eenheid: "st" }), rij({ eenheid: "st" })])).toBe(false);
    expect(heeftGemengdeEenheden([])).toBe(false);
  });
});

describe("labels", () => {
  it("formats months in Dutch", () => {
    expect(maandLabel("2026-03")).toBe("mrt 2026");
    expect(vorigJaarLabel("2026-01")).toBe("jan 2025");
    expect(maandLabel("onzin")).toBe("onzin");
  });
});

describe("totaalAantalZinvol", () => {
  it("is false without articles or with mixed units", () => {
    expect(totaalAantalZinvol([])).toBe(false);
    expect(totaalAantalZinvol([rij({ eenheid: "m" }), rij({ eenheid: "st" })])).toBe(false);
    expect(totaalAantalZinvol([rij({ eenheid: "st" })])).toBe(true);
  });
});
