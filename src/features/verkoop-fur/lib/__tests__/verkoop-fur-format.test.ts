import { describe, expect, it } from "vitest";
import { formatDate, formatStuks } from "../verkoop-fur-format";

describe("formatDate", () => {
  it("formats an ISO date as nl-BE dd/mm/yyyy", () => {
    expect(formatDate("2026-07-15")).toBe("15/07/2026");
  });

  it("renders an em dash for a null date (display-only placeholder)", () => {
    expect(formatDate(null)).toBe("\u2014");
  });
});

describe("formatStuks", () => {
  it("formats a whole number without decimals", () => {
    expect(formatStuks(42)).toBe("42");
  });

  it("formats thousands with the nl-BE '.' separator", () => {
    expect(formatStuks(12345)).toBe("12.345");
  });

  it("formats a decimal value with the nl-BE ',' decimal separator", () => {
    expect(formatStuks(42.5)).toBe("42,5");
  });
});
