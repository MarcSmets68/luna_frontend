import { beforeEach, describe, expect, it, vi } from "vitest";
import { zoekArtikelenAction } from "../actions";
import { artikelPrefillPatch } from "../artikel-prefill";

const getArtikelenMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  getArtikelen: (...args: unknown[]) => getArtikelenMock(...args),
}));

function art(artnr: string, extra: Record<string, unknown> = {}) {
  return {
    artnr,
    omschrijvingNl: `NL ${artnr}`,
    omschrijvingFr: `FR ${artnr}`,
    verkoopprijs: 10,
    aankoopprijs: 5,
    geblokkeerd: false,
    ...extra,
  };
}

beforeEach(() => getArtikelenMock.mockReset());

describe("zoekArtikelenAction", () => {
  it("makes no API call below 2 characters", async () => {
    expect(await zoekArtikelenAction(" a ")).toEqual({ items: [], truncated: false });
    expect(getArtikelenMock).not.toHaveBeenCalled();
  });

  it("only searches on artnr for 2-char terms, always excluding blocked", async () => {
    getArtikelenMock.mockResolvedValue({ items: [art("AB1")], hasMore: false });
    const res = await zoekArtikelenAction("AB");
    expect(getArtikelenMock).toHaveBeenCalledTimes(1);
    expect(getArtikelenMock).toHaveBeenCalledWith(1, 10, { geblokkeerd: false, artnr: "AB" });
    expect(res.items.map((i) => i.artnr)).toEqual(["AB1"]);
  });

  it("merges artnr hits first, de-duplicates case-insensitively and flags hasMore", async () => {
    getArtikelenMock
      .mockResolvedValueOnce({ items: [art("LED1"), art("LED2")], hasMore: false })
      .mockResolvedValueOnce({ items: [art("led1"), art("XYZ")], hasMore: true });
    const res = await zoekArtikelenAction("led");
    expect(getArtikelenMock).toHaveBeenCalledWith(1, 10, { geblokkeerd: false, omschrijving: "led" });
    expect(res.items.map((i) => i.artnr)).toEqual(["LED1", "LED2", "XYZ"]);
    expect(res.truncated).toBe(true);
  });

  it("caps at 15 items and reports truncated", async () => {
    const ten = (p: string) => Array.from({ length: 10 }, (_, i) => art(`${p}${i}`));
    getArtikelenMock
      .mockResolvedValueOnce({ items: ten("A"), hasMore: false })
      .mockResolvedValueOnce({ items: ten("B"), hasMore: false });
    const res = await zoekArtikelenAction("abc");
    expect(res.items).toHaveLength(15);
    expect(res.truncated).toBe(true);
  });

  it("propagates API errors", async () => {
    getArtikelenMock
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ items: [], hasMore: false });
    await expect(zoekArtikelenAction("abc")).rejects.toThrow("boom");
  });
});

describe("artikelPrefillPatch", () => {
  it("returns exactly the five fields, preferring NL over FR", () => {
    expect(artikelPrefillPatch(art("A1"))).toEqual({
      artnr: "A1",
      omschrijving: "NL A1",
      omschrijvingOfferte: "NL A1",
      verkoopprijs: 10,
      aankoopprijs: 5,
    });
  });

  it("falls back to FR when NL is blank", () => {
    const patch = artikelPrefillPatch(art("A1", { omschrijvingNl: "" }));
    expect(patch.omschrijving).toBe("FR A1");
    expect(patch.omschrijvingOfferte).toBe("FR A1");
  });
});
