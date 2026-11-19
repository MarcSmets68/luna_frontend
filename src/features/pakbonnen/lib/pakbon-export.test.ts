import { describe, expect, it } from "vitest";
import type { PakbonItem, PaklijnItem } from "@/lib/api-client";
import { buildPakbonRows, buildPakbonSections } from "./pakbon-export";

const line = (values: Partial<PaklijnItem> = {}) => ({ artnr: "A", omschr: "Artikel", bonnr: 42, aantal: 12, teLeveren: 3, afgehaald: 0, ...values } as PaklijnItem);
const kop = (values: Partial<PakbonItem> = {}) => ({ naam: "Klant", naam1: "Dienst", adres: "Straat 1", postnr: "9000", stad: "Gent", lnaam: "", ladres: "", lpostnr: "", lstad: "", datum: null, projectnr: 0, ...values } as PakbonItem);

describe("pakbon export", () => {
  it("uses the shipped aantal, rounds quantities, and excludes financial fields", () => {
    expect(buildPakbonRows([line({ aantal: 12.4, bedrag: 999 })])).toEqual([{ kind: "article", cells: ["42", "A", "Artikel", "12"] }]);
  });
  it("renders title and text rows and omits subtotals", () => {
    expect(buildPakbonRows([line({ artnr: " k00 " }), line({ infolijn: true }), line({ kolomtitel: true }), line({ subtotaal: true })]).map((row) => row.kind)).toEqual(["title", "text", "text"]);
  });
  it("handles empty lists", () => {
    expect(buildPakbonRows([])).toEqual([]);
    expect(buildPakbonSections(kop(), []).header[1]).toBe("Bonnr(s): —");
  });
  it("falls back only for a completely empty delivery address", () => {
    expect(buildPakbonSections(kop(), []).sections[1]).toEqual(["Leveradres", "Klant", "Dienst", "Straat 1", "9000 Gent"]);
    expect(buildPakbonSections(kop({ lnaam: "Werf" }), []).sections[1]).toEqual(["Leveradres", "Werf"]);
  });
  it("includes unique orders, project and collection details", () => {
    const result = buildPakbonSections(kop({ projectnr: 9, afgehaald: true, afgehaaldId: "Jan", afgehaaldDatum: "2026-09-18" }), [line(), line(), line({ bonnr: 43 })]);
    expect(result.header[1]).toBe("Bonnr(s): 42, 43");
    expect(result.sections).toContainEqual(["Projectnr", "9"]);
    expect(result.sections).toContainEqual(["Afgehaald", "Afgehaald door Jan op 18/9/2026"]);
  });
});
