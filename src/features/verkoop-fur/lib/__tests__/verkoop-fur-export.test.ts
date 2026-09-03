import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCsvContent,
  buildExportFileBaseName,
  buildPdfTableRows,
  escapeCsvField,
} from "../verkoop-fur-export";
import type { VerkoopFurItem } from "@/lib/api-client";

const items: VerkoopFurItem[] = [
  {
    klnr: 14644,
    naam: "CONE LIGHTING BV",
    aantalFurOrders: 3,
    totaalAantalStuks: 42,
    laatsteBesteldatum: "2026-07-15",
  },
  {
    klnr: 10165,
    naam: "STUDIO ARTLIGHT BV",
    aantalFurOrders: 1,
    totaalAantalStuks: 6,
    laatsteBesteldatum: "2026-03-02",
  },
];

describe("escapeCsvField", () => {
  it("returns plain text unchanged when no escaping is needed", () => {
    expect(escapeCsvField("CONE LIGHTING BV")).toBe("CONE LIGHTING BV");
  });

  it("quotes a field containing the delimiter", () => {
    expect(escapeCsvField("Foo; Bar BV")).toBe('"Foo; Bar BV"');
  });

  it("quotes and doubles internal double quotes", () => {
    expect(escapeCsvField('Say "hi" BV')).toBe('"Say ""hi"" BV"');
  });

  it("quotes a field containing a newline", () => {
    expect(escapeCsvField("Line1\nLine2")).toBe('"Line1\nLine2"');
  });
});

describe("buildCsvContent", () => {
  it("builds the exact expected CSV content for a fixture dataset", () => {
    const csv = buildCsvContent(items, "2025-08-20", "2026-08-20");

    const expected =
      "\uFEFF" +
      [
        "Periode van;2025-08-20",
        "Periode tot;2026-08-20",
        "",
        "Klnr;Naam;Aantal FUR-orders;Totaal aantal stuks;Laatste besteldatum",
        "14644;CONE LIGHTING BV;3;42;2026-07-15",
        "10165;STUDIO ARTLIGHT BV;1;6;2026-03-02",
      ].join("\n");

    expect(csv).toBe(expected);
  });

  it("produces a header-only body (no data rows) for an empty item list", () => {
    const csv = buildCsvContent([], "2025-08-20", "2026-08-20");

    const expected =
      "\uFEFF" +
      [
        "Periode van;2025-08-20",
        "Periode tot;2026-08-20",
        "",
        "Klnr;Naam;Aantal FUR-orders;Totaal aantal stuks;Laatste besteldatum",
      ].join("\n");

    expect(csv).toBe(expected);
  });

  it("escapes a naam field containing a semicolon", () => {
    const csv = buildCsvContent(
      [
        {
          klnr: 1,
          naam: "FOO; BAR BV",
          aantalFurOrders: 1,
          totaalAantalStuks: 1,
          laatsteBesteldatum: "2026-01-01",
        },
      ],
      "2025-08-20",
      "2026-08-20"
    );

    expect(csv).toContain('"FOO; BAR BV"');
  });

  it("renders an empty field for a null laatsteBesteldatum, not an em dash", () => {
    const csv = buildCsvContent(
      [
        {
          klnr: 1,
          naam: "FOO BV",
          aantalFurOrders: 1,
          totaalAantalStuks: 1,
          laatsteBesteldatum: null as unknown as string,
        },
      ],
      "2025-08-20",
      "2026-08-20"
    );

    expect(csv.endsWith("1;FOO BV;1;1;")).toBe(true);
    expect(csv).not.toContain("\u2014");
  });
});

describe("buildPdfTableRows", () => {
  it("builds formatted row arrays in the correct column order", () => {
    const rows = buildPdfTableRows(items);

    expect(rows).toEqual([
      ["14644", "CONE LIGHTING BV", "3", "42", "15/07/2026"],
      ["10165", "STUDIO ARTLIGHT BV", "1", "6", "02/03/2026"],
    ]);
  });

  it("returns an empty array for an empty item list", () => {
    expect(buildPdfTableRows([])).toEqual([]);
  });

  it("formats totaalAantalStuks with nl-BE thousands separators", () => {
    const rows = buildPdfTableRows([
      {
        klnr: 1,
        naam: "GROOTAFNEMER BV",
        aantalFurOrders: 1,
        totaalAantalStuks: 12345,
        laatsteBesteldatum: "2026-01-10",
      },
    ]);

    expect(rows[0][3]).toBe("12.345");
  });
});

describe("buildExportFileBaseName", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("matches the verkoop-fur_YYYY-MM-DD pattern using the frozen system date", () => {
    vi.setSystemTime(new Date(2026, 8, 3)); // 3 sept 2026 (month is 0-indexed)

    expect(buildExportFileBaseName()).toBe("verkoop-fur_2026-09-03");
  });

  it("zero-pads single-digit months and days", () => {
    vi.setSystemTime(new Date(2026, 0, 5)); // 5 jan 2026

    expect(buildExportFileBaseName()).toBe("verkoop-fur_2026-01-05");
  });
});
