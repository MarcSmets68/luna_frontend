import { describe, expect, it } from "vitest";
import {
  classifyLineKind,
  excludeTitleLines,
  flagsForLineKind,
  isTitleLine,
  TITLE_LINE_TEXT_CLASS,
} from "../line-classification";

describe("isTitleLine", () => {
  it("matches exact K00", () => {
    expect(isTitleLine("K00")).toBe(true);
  });

  it("matches lowercase k00", () => {
    expect(isTitleLine("k00")).toBe(true);
  });

  it("matches K00 with surrounding whitespace", () => {
    expect(isTitleLine(" K00 ")).toBe(true);
  });

  it("does not match K001", () => {
    expect(isTitleLine("K001")).toBe(false);
  });

  it("does not match an unrelated artnr", () => {
    expect(isTitleLine("ABC")).toBe(false);
  });
});

describe("excludeTitleLines", () => {
  it("drops K00 rows and keeps the rest", () => {
    const lines = [
      { artnr: "K00", omschrijving: "Section title" },
      { artnr: "ABC123", omschrijving: "Real article" },
      { artnr: " k00 ", omschrijving: "Another title" },
    ];

    expect(excludeTitleLines(lines)).toEqual([
      { artnr: "ABC123", omschrijving: "Real article" },
    ]);
  });
});

describe("TITLE_LINE_TEXT_CLASS", () => {
  it("is the primary-600 text color utility", () => {
    expect(TITLE_LINE_TEXT_CLASS).toBe("text-primary-600");
  });
});

describe("classifyLineKind", () => {
  it("classifies a plain article line", () => {
    expect(
      classifyLineKind({ artnr: "ABC123", subtotaal: false, kolomtitel: false, infolijn: false })
    ).toBe("artikel");
  });

  it("classifies a K00 line as titel", () => {
    expect(
      classifyLineKind({ artnr: "K00", subtotaal: false, kolomtitel: false, infolijn: false })
    ).toBe("titel");
  });

  it("classifies subtotaal before falling back to artnr", () => {
    expect(
      classifyLineKind({ artnr: "ABC", subtotaal: true, kolomtitel: false, infolijn: false })
    ).toBe("subtotaal");
  });

  it("classifies kolomtitel", () => {
    expect(
      classifyLineKind({ artnr: "ABC", subtotaal: false, kolomtitel: true, infolijn: false })
    ).toBe("kolomtitel");
  });

  it("classifies infolijn", () => {
    expect(
      classifyLineKind({ artnr: "ABC", subtotaal: false, kolomtitel: false, infolijn: true })
    ).toBe("infolijn");
  });

  it("gives subtotaal precedence over an incidental K00 artnr", () => {
    expect(
      classifyLineKind({ artnr: "K00", subtotaal: true, kolomtitel: false, infolijn: false })
    ).toBe("subtotaal");
  });
});

describe("flagsForLineKind", () => {
  it("returns all-false flags for artikel", () => {
    expect(flagsForLineKind("artikel")).toEqual({
      subtotaal: false,
      kolomtitel: false,
      infolijn: false,
    });
  });

  it("sets artnr K00 for titel", () => {
    expect(flagsForLineKind("titel")).toEqual({
      subtotaal: false,
      kolomtitel: false,
      infolijn: false,
      artnr: "K00",
    });
  });

  it("sets subtotaal true", () => {
    expect(flagsForLineKind("subtotaal")).toEqual({
      subtotaal: true,
      kolomtitel: false,
      infolijn: false,
    });
  });

  it("sets kolomtitel true", () => {
    expect(flagsForLineKind("kolomtitel")).toEqual({
      subtotaal: false,
      kolomtitel: true,
      infolijn: false,
    });
  });

  it("sets infolijn true", () => {
    expect(flagsForLineKind("infolijn")).toEqual({
      subtotaal: false,
      kolomtitel: false,
      infolijn: true,
    });
  });
});
