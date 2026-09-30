import { describe, expect, it } from "vitest";
import type { PlanningQueueItem } from "@/lib/api-client";
import { groupByDay, parseLocalDate } from "../group-by-day";

function item(lijnnr: number, levDatum: string | null): PlanningQueueItem {
  return {
    bonnr: 1000 + lijnnr,
    groepnr: 1,
    lijnnr,
    klant: "Klant",
    artnr: "ART",
    omschrijving: "Omschrijving",
    aantal: 1,
    levDatum,
  };
}

// Wednesday 2026-10-07, mid-afternoon
const TODAY = new Date(2026, 9, 7, 15, 30);

describe("parseLocalDate", () => {
  it("uses local date components (no UTC shift)", () => {
    const d = parseLocalDate("2026-10-07");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(7);
    expect(d.getHours()).toBe(0);
  });
});

describe("groupByDay", () => {
  it("returns an empty array for empty input", () => {
    expect(groupByDay([], TODAY)).toEqual([]);
  });

  it("merges all past dates into one overdue group", () => {
    const groups = groupByDay([item(1, "2026-10-01"), item(2, "2026-10-05"), item(3, "2026-10-06")], TODAY);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ key: "overdue", label: "Achterstallig", tone: "overdue" });
    expect(groups[0].items).toHaveLength(3);
  });

  it("labels today and tomorrow, ignoring time of day", () => {
    const groups = groupByDay([item(1, "2026-10-07"), item(2, "2026-10-07"), item(3, "2026-10-08")], TODAY);
    expect(groups.map((g) => g.label)).toEqual(["Vandaag", "Morgen"]);
    expect(groups[0].items).toHaveLength(2);
    expect(groups.every((g) => g.tone === "normal")).toBe(true);
  });

  it("labels later dates with a weekday/date", () => {
    const groups = groupByDay([item(1, "2026-10-12")], TODAY);
    expect(groups[0].label).toBe("maandag 12 oktober");
    expect(groups[0].key).toBe("2026-10-12");
    expect(groups[0].tone).toBe("normal");
  });

  it("always places the no-date group last, even when nulls are interspersed", () => {
    const groups = groupByDay([item(1, null), item(2, "2026-10-07"), item(3, null), item(4, "2026-10-09")], TODAY);
    expect(groups.map((g) => g.key)).toEqual(["2026-10-07", "2026-10-09", "no-date"]);
    const last = groups[groups.length - 1];
    expect(last).toMatchObject({ label: "Geen leverdatum", tone: "none" });
    expect(last.items.map((i) => i.lijnnr)).toEqual([1, 3]);
  });

  it("handles month boundaries for tomorrow", () => {
    const groups = groupByDay([item(1, "2026-11-01")], new Date(2026, 9, 31, 23, 59));
    expect(groups[0].label).toBe("Morgen");
  });
});
