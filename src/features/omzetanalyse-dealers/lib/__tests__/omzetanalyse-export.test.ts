import { describe, expect, it, vi } from "vitest";
import autoTable from "jspdf-autotable";
import type { OmzetanalyseResponse } from "@/lib/api-client";
import { drawNomaledHeader } from "@/lib/export/pdf-header";
import {
  CSV_HEADERS,
  buildCsvContent,
  buildExportFileBaseName,
  buildPdfModel,
  renderPdf,
} from "../omzetanalyse-export";

vi.mock("jspdf-autotable", () => ({ default: vi.fn() }));
vi.mock("@/lib/export/pdf-header", async (orig) => ({
  ...(await orig<typeof import("@/lib/export/pdf-header")>()),
  drawNomaledHeader: vi.fn(),
}));
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

  const withCategorie = (name: string): OmzetanalyseResponse => {
    const s = sectie(1);
    s.categorieen[0].categorie = name;
    return { ...periodeResponse, secties: [s] };
  };

  it("uses the category name literally as table title", () => {
    expect(buildPdfModel(withCategorie("Ledstrip"))[0].tables[0].title).toBe("Ledstrip");
  });

  it.each(["2D+", "1D", "3OL"])("keeps %s unchanged as title", (name) => {
    expect(buildPdfModel(withCategorie(name))[0].tables[0].title).toBe(name);
  });

  it.each(["", "   ", "\u00A0\u00A0"])("gives null title for blank %j", (name) => {
    expect(buildPdfModel(withCategorie(name))[0].tables[0].title).toBeNull();
  });

  it("sanitises nbsp, repeated whitespace and trims", () => {
    expect(buildPdfModel(withCategorie("  2D\u00A0\u00A0Plus "))[0].tables[0].title).toBe("2D Plus");
  });

  it("titles every category table but not the omzet/meters tables", () => {
    const s = sectie(1);
    s.categorieen = [s.categorieen[0], { ...s.categorieen[0], categorie: "Cover" }];
    const m = buildPdfModel({ ...periodeResponse, secties: [s] });
    const t = m[0].tables;
    expect(t).toHaveLength(4);
    expect(t[0].title).toBe("Ledstrip");
    expect(t[1].title).toBe("Cover");
    expect(t[2].title).toBeUndefined();
    expect(t[3].title).toBeUndefined();
  });

  it("keeps head/body of category tables intact", () => {
    const t = buildPdfModel(withCategorie("Ledstrip"))[0].tables[0];
    expect(t.head[0][0]).toBe("Artnr");
    expect(t.body[0][0]).toBe("LS100...");
  });

  it("keeps the dealer heading with titles present", () => {
    const m = buildPdfModel({
      ...periodeResponse,
      secties: [sectie(1, { dealerKlnr: 7, dealerNaam: "Acme" })],
    });
    expect(m[0].heading).toBe("Acme (7)");
    expect(m[0].tables[0].title).toBe("Ledstrip");
  });
});

describe("renderPdf – categorietitel", () => {
  function fakeDoc() {
    return {
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      text: vi.fn(),
      addPage: vi.fn(),
      internal: { pageSize: { getHeight: () => 210 } },
    };
  }
  function resp(name: string): OmzetanalyseResponse {
    const s = sectie(1);
    s.categorieen[0].categorie = name;
    return { ...periodeResponse, secties: [s] };
  }
  function run(startY: number, name: string) {
    vi.mocked(drawNomaledHeader).mockReturnValue(startY);
    vi.mocked(autoTable).mockClear();
    const doc = fakeDoc();
    renderPdf(doc as never, resp(name), new Date(2026, 0, 1));
    return doc;
  }

  it("draws bold 11pt title before the first autoTable", () => {
    const doc = run(50, "Ledstrip");
    expect(doc.text).toHaveBeenCalledWith("Ledstrip", 15, 53);
    expect(doc.setFont).toHaveBeenCalledWith("helvetica", "bold");
    expect(doc.setFontSize).toHaveBeenCalledWith(11);
    const textOrder = doc.text.mock.invocationCallOrder[0];
    const tableOrder = vi.mocked(autoTable).mock.invocationCallOrder[0];
    expect(textOrder).toBeLessThan(tableOrder);
    expect(vi.mocked(autoTable).mock.calls[0][1].startY).toBe(56);
  });

  it("adds a page first when too close to the page bottom", () => {
    const doc = run(170, "Ledstrip");
    expect(doc.addPage).toHaveBeenCalledTimes(1);
    expect(doc.text).toHaveBeenCalledWith("Ledstrip", 15, 23);
    expect(doc.addPage.mock.invocationCallOrder[0]).toBeLessThan(doc.text.mock.invocationCallOrder[0]);
  });

  it("does not add a page when there is enough space", () => {
    expect(run(50, "Ledstrip").addPage).not.toHaveBeenCalled();
  });

  it("draws no title and adds no page for an empty category name", () => {
    const doc = run(170, "");
    expect(doc.text).not.toHaveBeenCalled();
    expect(doc.addPage).not.toHaveBeenCalled();
  });
});
