import { describe, expect, it } from "vitest";
import { navItems } from "../nav-items";

describe("nav-items", () => {
  it("lists both report pages under Rapportage", () => {
    const reports = navItems.find((i) => i.key === "reports");
    expect(reports?.children?.map((c) => c.href)).toEqual([
      "/rapportage/verkoop-fur",
      "/rapportage/omzetanalyse-dealers",
    ]);
    const omzet = reports?.children?.find((c) => c.key === "reports-omzetanalyse-dealers");
    expect(omzet).toMatchObject({ label: "Omzetanalyse dealers", available: true });
  });
});
