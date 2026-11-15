import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import {
  CSV_HEADERS,
  buildCsvContent,
  buildExportFileBaseName,
  buildPdfModel,
  renderPdf,
} from "../verkoopsanalyse-export";
import { response, rij } from "../../test-utils/fixtures";

describe("buildCsvContent", () => {
  it("writes one line per article per month plus the totals", () => {
    const csv = buildCsvContent(response(), 1);
    const lines = csv.replace(/^﻿/, "").split("\n");
    expect(lines[0]).toBe("Periode;2025-11-01 t/m 2026-10-31");
    const headerIndex = lines.indexOf(CSV_HEADERS.join(";"));
    expect(headerIndex).toBeGreaterThan(0);
    const data = lines.slice(headerIndex + 1);
    expect(data).toHaveLength(24); // 12 article months + 12 total months
    expect(data[0]).toBe("NOMALED.FUR01;Furniture profiel;st;2025-11;10;5;100.0;100;80;25.0");
    expect(data[12].startsWith("TOTAAL;;;2025-11;10;5;100.0;")).toBe(true);
  });

  it("leaves the total aantal empty when units are mixed and marks groups with *", () => {
    const csv = buildCsvContent(
      response({ rijen: [rij({ eenheid: "m" }), rij({ artnr: "NOMA", swBegins: true, omschrijving: null })] }),
      0,
    );
    expect(csv).toContain("\nNOMA*;;st;2025-11;");
    expect(csv).toContain("\nTOTAAL;;;2025-11;;;;200;160;25.0");
    expect(csv).toContain("Dealers;Alle Nomaled-dealers (1)");
  });

  it("neutralises formula injection in free text", () => {
    const csv = buildCsvContent(response({ rijen: [rij({ omschrijving: "=HYPERLINK()" })] }), 1);
    expect(csv).toContain(";'=HYPERLINK();");
  });
});

describe("PDF", () => {
  it("prints only the total table for a single article", () => {
    expect(buildPdfModel(response())).toHaveLength(1);
  });

  it("adds a table per article when there are several, with 12 months and a total", () => {
    const model = buildPdfModel(response({ rijen: [rij(), rij({ artnr: "B2", eenheid: "m" })] }));
    expect(model).toHaveLength(3);
    expect(model[0].head[0]).toEqual(["Maand", "Omzet (EUR)", "Vorig jaar", "Groei"]); // mixed units
    expect(model[2].title).toBe("B2 - Furniture profiel (m)");
    expect(model[1].body).toHaveLength(12);
    expect(model[1].foot[0][0]).toBe("Totaal 12 maanden");
  });

  it("renders without throwing", () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    expect(() => renderPdf(doc, response({ rijen: [rij(), rij({ artnr: "B2" })] }), 1)).not.toThrow();
  });

  it("builds a dated file name", () => {
    expect(buildExportFileBaseName(new Date(2026, 10, 5))).toBe("verkoopsanalyse_2026-11-05");
  });
});
