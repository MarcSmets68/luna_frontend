import { describe, expect, it } from "vitest";
import { excludeTitleLines, isTitleLine, TITLE_LINE_TEXT_CLASS } from "../line-classification";

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
