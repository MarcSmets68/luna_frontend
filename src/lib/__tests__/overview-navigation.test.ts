import { describe, expect, it } from "vitest";
import { overviewReturnHref, withOverviewContext } from "../overview-navigation";

describe("overview navigation context", () => {
  it("roundtrips filters, page numbers, spaces and special characters", () => {
    const overview = "/voorraad?page=3&artnr=100%25&omschrijving=LED+%26+wit&lageVoorraad=true";
    const detail = withOverviewContext("/voorraad/100%25", overview, "/voorraad");
    const value = new URL(detail, "https://luna.invalid").searchParams.get("returnTo");
    expect(overviewReturnHref(value, "/voorraad")).toBe(overview);
  });

  it("keeps direct/unfiltered detail URLs and fallback links simple", () => {
    expect(withOverviewContext("/orders/123", "/orders/alle?page=1", "/orders/alle")).toBe("/orders/123");
    expect(overviewReturnHref(undefined, "/orders/alle")).toBe("/orders/alle");
  });

  it.each(["https://evil.invalid/orders/alle?page=2", "//evil.invalid/orders/alle?page=2", "javascript:alert(1)", "/orders/alle-other?page=2", "/voorraad?page=2", ["/orders/alle?page=2"]])("rejects non-overview return destinations: %s", (value) => {
    expect(overviewReturnHref(value, "/orders/alle")).toBe("/orders/alle");
  });
});
