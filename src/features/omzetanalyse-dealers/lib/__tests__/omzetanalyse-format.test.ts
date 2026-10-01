import { describe, expect, it } from "vitest";
import {
  DASH,
  buildPeriodeLabel,
  formatGrowth,
  formatInteger,
  formatMoney,
  formatQty,
  getKolomLabels,
} from "../omzetanalyse-format";
import { jarenResponse, periodeResponse } from "../../test-utils/fixtures";

describe("omzetanalyse-format", () => {
  it("renders null as an em-dash", () => {
    expect(formatQty(null)).toBe(DASH);
    expect(formatMoney(null)).toBe(DASH);
    expect(formatInteger(null)).toBe(DASH);
  });

  it("formats quantities with max 3 decimals (nl-BE)", () => {
    expect(formatQty(10.12345)).toBe("10,123");
    expect(formatQty(5)).toBe("5");
  });

  it("formats money with 2 decimals", () => {
    expect(formatMoney(1.5)).toBe("1,50");
  });

  it("formats growth with sign and true minus; null gives nothing", () => {
    expect(formatGrowth(12.34)).toBe("+12,3\u00A0%");
    expect(formatGrowth(-4)).toBe("\u22124,0\u00A0%");
    expect(formatGrowth(null)).toBe("");
  });

  it("builds period labels from the filter dates", () => {
    expect(buildPeriodeLabel("2026-01-01", "2026-03-31")).toBe("01/01/2026 t/m 31/03/2026");
    expect(buildPeriodeLabel("2026-01-01", null)).toBe("Vanaf 01/01/2026");
    expect(buildPeriodeLabel(null, null)).toBe("Periode");
  });

  it("uses backend labels in JAREN mode and a built label in PERIODE mode", () => {
    expect(getKolomLabels(jarenResponse)).toEqual(["2026", "2025", "2024", "2023", "2022"]);
    expect(getKolomLabels(periodeResponse)).toEqual(["01/01/2026 t/m 31/03/2026"]);
  });
});
