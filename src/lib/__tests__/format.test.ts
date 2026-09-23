import { describe, expect, it } from "vitest";
import { formatBedragKort } from "../format";

describe("formatBedragKort", () => {
  it("formats zero", () => {
    expect(formatBedragKort(0)).toBe("€ 0");
  });

  it("formats a value below 1000 without abbreviation", () => {
    expect(formatBedragKort(999)).toBe("€ 999");
  });

  it("abbreviates a value of exactly 1000 as thousands", () => {
    expect(formatBedragKort(1000)).toBe("€ 1k");
  });

  it("abbreviates a mid-range value as rounded thousands", () => {
    expect(formatBedragKort(43200)).toBe("€ 43k");
  });

  it("abbreviates a large value as rounded thousands", () => {
    expect(formatBedragKort(86400)).toBe("€ 86k");
  });
});
