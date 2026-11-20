import { describe, expect, it, vi } from "vitest";
import { aanvullingFixtureBron } from "../aanvulling-fixtures";
import { AANVULLING_PAGE_SIZE, classificeer, laadAanvullingWerklijst } from "../aanvulling-werklijst";

describe("Aanvulling nakijken", () => {
  it("classificeert de A4-gevallen op interne beschikbaarheid, onafhankelijk van extern en inkoop", async () => {
    const snapshot = (await aanvullingFixtureBron.lees())!;
    const artikel = (artnr: string) => snapshot.artikelen.find((artikel) => artikel.artnr === artnr)!;

    expect(classificeer(artikel("VB-108"))).toMatchObject({ beschikbaar: 0, signaal: "dringend" });
    expect(artikel("VB-108")).toMatchObject({
      externAantal: 20, externGereserveerd: 4, openInkoop: 30, bevestigdeLeverdatum: null,
    });
    expect(classificeer(artikel("VB-101"))).toMatchObject({ beschikbaar: 3, signaal: "onder-minimum" });
    expect(classificeer(artikel("VB-102"))).toMatchObject({ beschikbaar: 5, signaal: "geen-signaal" });
    expect(classificeer(artikel("VB-103"))).toMatchObject({ beschikbaar: null, signaal: "te-controleren" });
    expect(classificeer(artikel("VB-109"))).toMatchObject({ beschikbaar: -2, signaal: "dringend" });
    expect(classificeer(artikel("VB-105"))).toMatchObject({ beschikbaar: 7, signaal: "te-controleren" });
    expect(classificeer(artikel("VB-110"))).toMatchObject({ beschikbaar: 8, signaal: "geen-signaal" });
    expect(classificeer({ ...artikel("VB-102"), voorraad: null })).toMatchObject({ beschikbaar: null, signaal: "te-controleren" });
    expect(classificeer({ ...artikel("VB-102"), voorraadMin: -1 })).toMatchObject({ beschikbaar: 5, signaal: "te-controleren" });
  });

  it("sorteert alle actieve voorraadartikelen vóór paginering (A5)", async () => {
    const snapshot = (await aanvullingFixtureBron.lees())!;
    expect(snapshot.artikelen.findIndex(({ artnr }) => artnr === "VB-108")).toBeGreaterThanOrEqual(AANVULLING_PAGE_SIZE);
    const first = await laadAanvullingWerklijst(aanvullingFixtureBron, {});
    const second = await laadAanvullingWerklijst(aanvullingFixtureBron, { page: "2" });
    if (first.status !== "beschikbaar" || second.status !== "beschikbaar") throw new Error("Bron niet beschikbaar");

    expect(first.artikelen.map(({ artnr }) => artnr)).toEqual([
      "VB-109", "VB-108", "VB-101", "VB-106", "VB-105", "VB-103",
    ]);
    expect(second.artikelen.map(({ artnr }) => artnr)).toEqual(["VB-102", "VB-110", "VB-107", "VB-104"]);
    expect(first).toMatchObject({ aantal: 10, pagina: 1, paginaAantal: 2 });
    expect(second.pagina).toBe(2);
  });

  it("combineert filters vóór paginering en vindt ook een artikel van een latere pagina", async () => {
    const result = await laadAanvullingWerklijst(aanvullingFixtureBron, {
      zoek: "  VB-102 ", groep: "Profielen", leverancier: "Voorbeeldleverancier A", urgentie: "geen-signaal", page: "2",
    });
    expect(result).toMatchObject({
      status: "beschikbaar",
      aantal: 1,
      pagina: 1,
      artikelen: [{ artnr: "VB-102" }],
    });
    await expect(laadAanvullingWerklijst(aanvullingFixtureBron, {
      zoek: "montagePLAAT", groep: "Beslag", leverancier: "Voorbeeldleverancier B", urgentie: "onder-minimum",
    })).resolves.toMatchObject({ aantal: 1, artikelen: [{ artnr: "VB-106" }] });
    for (const params of [{ groep: "Beslag" }, { leverancier: "Voorbeeldleverancier B" }, { urgentie: "dringend" }]) {
      await expect(laadAanvullingWerklijst(aanvullingFixtureBron, {
        zoek: "VB-102", ...params,
      })).resolves.toMatchObject({ aantal: 0, artikelen: [] });
    }
  });

  it("geeft na bronuitval geen lege lijst terug (A5)", async () => {
    const snapshot = await aanvullingFixtureBron.lees();
    const lees = vi.fn().mockResolvedValueOnce(snapshot).mockRejectedValueOnce(new Error("onbereikbaar")).mockResolvedValueOnce(null);
    await expect(laadAanvullingWerklijst({ lees }, {})).resolves.toMatchObject({ status: "beschikbaar" });
    for (let i = 0; i < 2; i++) {
      const result = await laadAanvullingWerklijst({ lees }, {});
      expect(result).toMatchObject({ status: "niet-beschikbaar" });
      expect(result).not.toHaveProperty("artikelen");
    }
  });
});
