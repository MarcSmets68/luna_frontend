import { describe, expect, it } from "vitest";
import { normalizeRouteParam } from "../utils";

describe("normalizeRouteParam", () => {
  it("leaves a plain value without percent signs unchanged", () => {
    expect(normalizeRouteParam("AB123")).toBe("AB123");
  });

  it("unwinds a single level of percent-encoding", () => {
    expect(normalizeRouteParam("100%25.1009020BL")).toBe("100%.1009020BL");
  });

  it("unwinds a double-encoded value caused by the Next.js param double-encoding bug", () => {
    expect(normalizeRouteParam("100%2525.1009020BL")).toBe("100%.1009020BL");
  });

  it("stops decoding once a literal percent sign is reached instead of throwing", () => {
    expect(normalizeRouteParam("100%.1009020BL")).toBe("100%.1009020BL");
  });
});
