import { describe, expect, it } from "vitest";
import type { LakproductieItem, PlanningQueueItem } from "@/lib/api-client";
import {
  fromLak,
  fromLedMontage,
  groupByWeek,
  isoWeekNumber,
  type PlanningEntry,
} from "../build-planning";

// Thursday 22 October 2026 - ISO week 43 (Mon 19/10 - Sun 25/10).
const TODAY = new Date(2026, 9, 22);

function entry(overrides: Partial<PlanningEntry>): PlanningEntry {
  return {
    key: overrides.key ?? `k-${overrides.bonnr ?? 1}-${overrides.datum ?? "none"}`,
    afdeling: "led-montage",
    bonnr: 1,
    groepnr: null,
    klant: "Klant",
    artnr: "ART",
    omschrijving: "",
    aantal: 1,
    datum: null,
    kleur: null,
    status: null,
    ...overrides,
  };
}

describe("isoWeekNumber", () => {
  it("handles regular weeks and year boundaries", () => {
    expect(isoWeekNumber(new Date(2026, 9, 22))).toBe(43);
    expect(isoWeekNumber(new Date(2026, 0, 1))).toBe(1);
    expect(isoWeekNumber(new Date(2027, 0, 1))).toBe(53);
    expect(isoWeekNumber(new Date(2027, 0, 4))).toBe(1);
  });
});

describe("fromLedMontage", () => {
  it("maps queue items with levDatum as datum", () => {
    const item: PlanningQueueItem = {
      bonnr: 100,
      groepnr: 2,
      lijnnr: 3,
      klant: "Acme",
      artnr: " LED1 ",
      omschrijving: "Strip ",
      aantal: 4,
      levDatum: "2026-10-23",
    };
    expect(fromLedMontage([item])).toEqual([
      {
        key: "led-montage|100|2|3",
        afdeling: "led-montage",
        bonnr: 100,
        groepnr: 2,
        klant: "Acme",
        artnr: "LED1",
        omschrijving: "Strip",
        aantal: 4,
        datum: "2026-10-23",
        kleur: null,
        status: null,
      },
    ]);
  });
});

describe("fromLak", () => {
  const base = {
    artnr: "ALU1",
    omschrijving: "Profiel",
    behandeling: "ANO-BRONS",
    groepeerKleur: "",
    klant: "Acme",
    bonnr: 200,
    lijnnr: 1,
    prodLijnnr: null,
    groepnr: 1,
    aantal: 6,
    status: "Nog te bestellen",
    deadline: "2026-10-30",
  } as unknown as LakproductieItem;

  it("skips min-max-voorraad rows and uses deadline + kleur fallback", () => {
    const items = [
      { ...base, bron: "lopende-orders" },
      { ...base, bron: "lopende-productielijnen", prodLijnnr: 2, groepeerKleur: "ANO · Brons" },
      { ...base, bron: "min-max-voorraad", bonnr: null, klant: null, deadline: null },
    ] as LakproductieItem[];

    const result = fromLak(items);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      afdeling: "lak",
      bonnr: 200,
      datum: "2026-10-30",
      kleur: "ANO-BRONS",
      status: "Nog te bestellen",
    });
    expect(result[1].kleur).toBe("ANO · Brons");
    expect(result[0].key).not.toBe(result[1].key);
  });
});

describe("groupByWeek", () => {
  it("puts overdue first, then weeks ascending, undated last", () => {
    const groups = groupByWeek(
      [
        entry({ bonnr: 5, datum: null }),
        entry({ bonnr: 4, datum: "2026-11-09" }),
        entry({ bonnr: 3, datum: "2026-10-27" }),
        entry({ bonnr: 2, datum: "2026-10-22" }),
        entry({ bonnr: 1, datum: "2026-10-21" }),
        entry({ bonnr: 6, datum: "2026-10-25" }),
      ],
      TODAY
    );

    expect(groups.map((g) => [g.label, g.range, g.tone])).toEqual([
      ["Achterstallig", null, "overdue"],
      ["Deze week (week 43)", "19/10 - 25/10", "current"],
      ["Volgende week (week 44)", "26/10 - 01/11", "normal"],
      ["Week 46", "09/11 - 15/11", "normal"],
      ["Geen datum", null, "none"],
    ]);
    expect(groups[1].entries.map((e) => e.bonnr)).toEqual([2, 6]);
  });

  it("sorts within a week by datum, then bonnr", () => {
    const [week] = groupByWeek(
      [
        entry({ bonnr: 9, datum: "2026-10-24" }),
        entry({ bonnr: 8, datum: "2026-10-23", afdeling: "lak" }),
        entry({ bonnr: 7, datum: "2026-10-24" }),
      ],
      TODAY
    );
    expect(week.entries.map((e) => e.bonnr)).toEqual([8, 7, 9]);
  });

  it("returns no groups for no entries", () => {
    expect(groupByWeek([], TODAY)).toEqual([]);
  });
});
