import { describe, expect, it } from "vitest";
import type { OmzetanalyseResponse } from "@/lib/api-client";
import {
  CSV_HEADERS,
  buildCsvContent,
  buildExportFileBaseName,
  buildPdfModel,
} from "../omzetanalyse-export";
import {
  baseFilters,
  jarenResponse,
  periode,
  periodeResponse,
  sectie,
} from "../../test-utils/fixtures";

const BOM = "\uFEFF";
const HEADER = CSV_HEADERS.join(";");

function lines(csv: string): string[] {
  return csv.replace(BOM, "").split("\n");
}

describe("buildCsvContent", () => {
  it("starts with BOM, preamble, blank line and header", () => {
    const csv = buildCsvContent(periodeResponse);
    expect(csv.startsWith(BOM)).toBe(true);
    expect(lines(csv).slice(0, 8)).toEqual([
      "Modus;PERIODE",
      "Datum van;2026-01-01",
      "Datum tot;2026-03-31",
      "Klant;",
      "Soort;",
      "Per dealer;Nee",
      "",
      HEADER,
    ]);
  });

  it("PERIODE mode: exact rows, empty dealer columns, empty cells for null", () => {
    const l = lines(buildCsvContent(periodeResponse));
    const col = "01/01/2026 t/m 31/03/2026";
    expect(l.slice(8)).toEqual([
      `;;Ledstrip;LS100*;m;ARTIKEL;${col};10.5;;;;;;;;;;;;;`,
      `;;Ledstrip;;;CATEGORIE_TOTAAL;${col};10.5;;3;100.5;50;150.5;;;;;;;;`,
      `;;;;;SECTIE_TOTAAL;${col};;;3;100.5;50;150.5;;;;;;;;`,
      `;;;;;METERS;${col};;;;;;;;;;;;;7;2.5`,
    ]);
  });

  it("JAREN mode: one row per column with raw growth numbers", () => {
    const l = lines(buildCsvContent(jarenResponse)).slice(8);
    // 5 columns x (1 article + 1 category total + 1 section total + 1 meters)
    expect(l).toHaveLength(20);
    expect(l[0]).toBe(";;Ledstrip;LS100*;m;ARTIKEL;2026;10.5;;;;;;12.34;;;;;;;");
    expect(l[1]).toBe(";;Ledstrip;LS100*;m;ARTIKEL;2025;11.5;;;;;;;;;;;;;");
    expect(l[5]).toBe(";;Ledstrip;;;CATEGORIE_TOTAAL;2026;10.5;;3;100.5;50;150.5;;;;;;-4;;");
  });

  it("per-dealer mode fills dealer columns and escapes names", () => {
    const res: OmzetanalyseResponse = {
      ...periodeResponse,
      filters: { ...baseFilters, soort: "LS", soortOmschr: "Led; strips", perDealer: true },
      secties: [sectie(1, { dealerKlnr: 12, dealerNaam: 'Jan "de" Man; BV' })],
    };
    const csv = buildCsvContent(res);
    const l = lines(csv);
    expect(l).toContain('Soort;"LS - Led; strips"');
    expect(l).toContain("Per dealer;Ja");
    expect(l[8].startsWith('12;"Jan ""de"" Man; BV";Ledstrip;LS100*;m;ARTIKEL;')).toBe(true);
  });

  it("is valid (preamble + header only) for an empty result", () => {
    const csv = buildCsvContent({ ...periodeResponse, secties: [] });
    const l = lines(csv);
    expect(l[l.length - 1]).toBe(HEADER);
    expect(l).toHaveLength(8);
  });

  it("leaves qty empty on the category total for mixed-unit categories", () => {
    const res: OmzetanalyseResponse = { ...periodeResponse, secties: [sectie(1, {}, true)] };
    const total = lines(buildCsvContent(res)).find((x) => x.includes("CATEGORIE_TOTAAL"))!;
    const cells = total.split(";");
    expect(cells[7]).toBe("");
    expect(cells[8]).toBe("");
    expect(cells[9]).toBe("3");
  });

  it("outputs nothing for fully-null values", () => {
    const s = sectie(1);
    s.categorieen[0].rijen[0].perioden = [periode()];
    const res: OmzetanalyseResponse = { ...periodeResponse, secties: [s] };
    const row = lines(buildCsvContent(res))[8];
    expect(row).not.toContain("null");
    expect(row).not.toContain("\u2014");
  });
});

describe("buildExportFileBaseName", () => {
  it("formats the date", () => {
    expect(buildExportFileBaseName(new Date(2026, 8, 3))).toBe("omzetanalyse-dealers_2026-09-03");
  });
});

describe("buildPdfModel", () => {
  it("has no dealer heading in normal mode and hides qty subtotal when mixed", () => {
    const m = buildPdfModel({ ...periodeResponse, secties: [sectie(1, {}, true)] });
    expect(m).toHaveLength(1);
    expect(m[0].heading).toBeNull();
    const body = m[0].tables[0].body.map((r) => (typeof r[0] === "string" ? r[0] : r[0].content));
    expect(body).not.toContain("Totaal aantal");
    expect(body).toContain("Aantal orders");
  });

  it("adds a heading per dealer and growth as second line in JAREN", () => {
    const m = buildPdfModel({
      ...jarenResponse,
      secties: [sectie(5, { dealerKlnr: 7, dealerNaam: "Acme" })],
    });
    expect(m[0].heading).toBe("Acme (7)");
    const artikel = m[0].tables[0].body[0];
    expect(artikel[2]).toBe("10,5\n+12,3 %");
    expect(artikel[3]).toBe("");
  });
});
