import { describe, expect, it } from "vitest";
import type { PakbonItem, PaklijnItem } from "@/lib/api-client";
import { buildPakbonRows, buildPakbonSections } from "./pakbon-export";

const line = (values: Partial<PaklijnItem> = {}) => ({ artnr: "A", omschr: "Artikel", bonnr: 42, aantal: 12, teLeveren: 3, afgehaald: 0, ...values } as PaklijnItem);
const kop = (values: Partial<PakbonItem> = {}) => ({ naam: "Klant", naam1: "Dienst", adres: "Straat 1", postnr: "9000", stad: "Gent", lnaam: "", ladres: "", lpostnr: "", lstad: "", datum: null, projectnr: 0, ...values } as PakbonItem);

describe("pakbon export", () => {
  it.each([[2, "2"], [1.5, "1,5"], [12.3456, "12,346"], [0, ""], [-1.25, "-1,25"]])("formats shipped quantity %s as %s without financial fields", (aantal, formatted) => {
    expect(buildPakbonRows([line({ bonnr: 0, aantal, bedrag: 999 })])).toEqual([{ kind: "article", cells: ["A", "Artikel", formatted] }]);
  });
  it("renders title and text rows and omits subtotals", () => {
    expect(buildPakbonRows([line({ artnr: " k00 " }), line({ infolijn: true }), line({ kolomtitel: true }), line({ subtotaal: true })])).toEqual([
      { kind: "order", cells: ["# ORDERBEVESTIGING :     000,0042"] },
      { kind: "title", cells: ["Artikel"] },
      { kind: "text", cells: ["Artikel"] },
      { kind: "text", cells: ["Artikel"] },
    ]);
  });
  it("inserts order groups only when visible lines change order", () => {
    const rows = buildPakbonRows([line(), line(), line({ bonnr: 99, subtotaal: true }), line({ bonnr: 1234567 }), line({ bonnr: 0 }), line()]);
    expect(rows.filter((row) => row.kind === "order").map((row) => row.cells[0])).toEqual([
      "# ORDERBEVESTIGING :     000,0042",
      "# ORDERBEVESTIGING :     123,4567",
      "# ORDERBEVESTIGING :     000,0042",
    ]);
    expect(buildPakbonRows([line({ subtotaal: true })])).toEqual([]);
  });
  it("handles empty lists", () => {
    expect(buildPakbonRows([])).toEqual([]);
    expect(buildPakbonSections(kop(), []).header[1]).toBe("Bonnr(s): —");
  });
  it("falls back independently for each empty delivery field", () => {
    expect(buildPakbonSections(kop(), []).sections[1]).toEqual(["Leveradres", "Klant", "Dienst", "Straat 1", "9000 Gent"]);
    expect(buildPakbonSections(kop({ lnaam: "Werf", lpostnr: "8000" }), []).sections[1]).toEqual(["Leveradres", "Werf", "Dienst", "Straat 1", "8000 Gent"]);
    expect(buildPakbonSections(kop({ ladres: "Werfstraat", lstad: "Brugge" }), []).sections[1]).toEqual(["Leveradres", "Klant", "Dienst", "Werfstraat", "9000 Brugge"]);
  });
  it("uses legacy labels and complete delivery values", () => {
    const result = buildPakbonSections(kop({ klnr: 123, uRef: "REF", verzending: "Post", tracknr: "BE1", lnaam: "Werf", ladres: "Haven 2", lpostnr: "8000", lstad: "Brugge" }), []);
    expect(result.header[0]).toContain("Klantkode: 123");
    expect(result.sections).toContainEqual(["Facturatieadres", "Klant", "Dienst", "Straat 1", "9000 Gent"]);
    expect(result.sections).toContainEqual(["Leveradres", "Werf", "Dienst", "Haven 2", "8000 Brugge"]);
    expect(result.sections).toContainEqual(["Uw ref.", "REF"]);
    expect(result.sections).toContainEqual(["Transport", "Post / BE1"]);
  });
  it("treats whitespace-only delivery fields as empty", () => {
    expect(buildPakbonSections(kop({ lnaam: "  ", ladres: "\t", lpostnr: " ", lstad: "\n" }), []).sections[1]).toEqual(["Leveradres", "Klant", "Dienst", "Straat 1", "9000 Gent"]);
    expect(buildPakbonSections(kop({ lnaam: " Werf ", ladres: " ", lpostnr: " 8000 ", lstad: " " }), []).sections[1]).toEqual(["Leveradres", "Werf", "Dienst", "Straat 1", "8000 Gent"]);
  });
  it("includes unique orders, project and collection details", () => {
    const result = buildPakbonSections(kop({ projectnr: 9, afgehaald: true, afgehaaldId: "Jan", afgehaaldDatum: "2026-09-18" }), [line(), line(), line({ bonnr: 43 })]);
    expect(result.header[1]).toBe("Bonnr(s): 42, 43");
    expect(result.sections).toContainEqual(["Projectnr", "9"]);
    expect(result.sections).toContainEqual(["Afgehaald", "Afgehaald door Jan op 18/9/2026"]);
  });
});
