import { describe, expect, it } from "vitest";
import { EFFECTIEF_STATUS, getEffectiefStatus } from "../effectief-status";

describe("effectief-status", () => {
  it("maps every status to a label and tone", () => {
    expect(getEffectiefStatus("niet_effectief").label).toBe("Niet gepickt");
    expect(getEffectiefStatus("gedeeltelijk_effectief").label).toBe(
      "Gedeeltelijk",
    );
    expect(getEffectiefStatus("geen_effectief").label).toBe("Geen effectief");
    expect(getEffectiefStatus("volledig_effectief").label).toBe("Volledig");
  });

  it("uses distinct classes per status", () => {
    const classes = Object.values(EFFECTIEF_STATUS).map((s) => s.className);
    expect(new Set(classes).size).toBe(4);
  });
});
