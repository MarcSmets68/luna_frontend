import { describe, expect, it } from "vitest";
import { escapeCsvField } from "../csv";

describe("escapeCsvField", () => {
  it("leaves plain text unchanged", () => {
    expect(escapeCsvField("Gewone tekst")).toBe("Gewone tekst");
  });

  it("still quotes delimiters, double quotes and newlines", () => {
    expect(escapeCsvField("a;b")).toBe('"a;b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("a\nb")).toBe('"a\nb"');
  });

  it("quotes values containing a comma", () => {
    expect(escapeCsvField("Smets, Marc")).toBe('"Smets, Marc"');
  });

  describe("formula injection (text fields)", () => {
    it.each([
      ["=SUM(A1)", "'=SUM(A1)"],
      ["+1", "'+1"],
      ["-1", "'-1"],
      ["@x", "'@x"],
      ["\tcmd", "'\tcmd"],
    ])("prefixes %j with an apostrophe", (input, expected) => {
      expect(escapeCsvField(input)).toBe(expected);
    });

    it("prefixes a carriage-return value and then quotes it", () => {
      expect(escapeCsvField("\rcmd")).toBe(`"'\rcmd"`);
    });

    it("prefixes before quoting when the value also needs quoting", () => {
      expect(escapeCsvField('=HYPERLINK("x";"y")')).toBe(`"'=HYPERLINK(""x"";""y"")"`);
    });

    it("does not touch triggers that are not at the start", () => {
      expect(escapeCsvField("a=b")).toBe("a=b");
      expect(escapeCsvField("Foo-Bar")).toBe("Foo-Bar");
    });

    it("quotes and neutralises a formula after a comma", () => {
      expect(escapeCsvField("Acme,=1+1")).toBe(`"Acme,'=1+1"`);
      expect(escapeCsvField("Globex,=cmd|' /C calc'!A0")).toBe(`"Globex,'=cmd|' /C calc'!A0"`);
    });

    it.each([
      ["a;=b", `"a;'=b"`],
      ["Foo, -Bar", `"Foo, '-Bar"`],
      ["x,+1,@y", `"x,'+1,'@y"`],
      ['x",=1+1', `"x"",'=1+1"`],
      ["=a,=b", `"'=a,'=b"`],
    ])("neutralises embedded triggers in %j", (input, expected) => {
      expect(escapeCsvField(input)).toBe(expected);
    });

    it("does not prefix an empty string", () => {
      expect(escapeCsvField("")).toBe("");
    });
  });

  describe("numeric fields", () => {
    it.each(["-1", "-12.5", "-12,5", "-0.5e-3", "42", ""])("keeps %j intact", (n) => {
      expect(escapeCsvField(n, { numeric: true })).toBe(n);
    });

    it("still neutralises non-numeric content in a numeric column", () => {
      expect(escapeCsvField("=1+1", { numeric: true })).toBe("'=1+1");
      expect(escapeCsvField("-1+cmd", { numeric: true })).toBe("'-1+cmd");
      expect(escapeCsvField("1,=2", { numeric: true })).toBe(`"1,'=2"`);
    });
  });
});
