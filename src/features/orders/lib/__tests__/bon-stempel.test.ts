import { describe, expect, it } from "vitest";
import { annuleerBlokkade, getStempelLabel, kanAnnuleren } from "../bon-stempel";

describe("kanAnnuleren", () => {
  it.each(["V", "B"])("is true for %s", (s) => expect(kanAnnuleren(s)).toBe(true));
  it.each(["O", "D", "", "X"])("is false for %j", (s) => expect(kanAnnuleren(s)).toBe(false));
});

describe("getStempelLabel", () => {
  it("maps the known stempels", () => {
    expect(getStempelLabel("O")).toBe("Open");
    expect(getStempelLabel("V")).toBe("In verwerking");
    expect(getStempelLabel("B")).toBe("Besteld");
    expect(getStempelLabel("D")).toBe("Afgeleverd");
  });
  it("falls back to the raw value or Onbekend", () => {
    expect(getStempelLabel("X")).toBe("X");
    expect(getStempelLabel("")).toBe("Onbekend");
  });
});

describe("annuleerBlokkade", () => {
  it("is null for V/B", () => {
    expect(annuleerBlokkade("V")).toBeNull();
    expect(annuleerBlokkade("B")).toBeNull();
  });
  it("has distinct texts for O and D", () => {
    expect(annuleerBlokkade("O")).toBe("Deze order is open en kan niet geannuleerd worden.");
    expect(annuleerBlokkade("D")).toBe(
      "Deze order is afgeleverd en kan niet meer geannuleerd worden."
    );
  });
  it("is generic for unknown values", () => {
    expect(annuleerBlokkade("X")).toBe("Deze order kan niet geannuleerd worden.");
    expect(annuleerBlokkade("")).toBe("Deze order kan niet geannuleerd worden.");
  });
});
