import type { AanvullingArtikel, AanvullingBron } from "./aanvulling-werklijst";

function voorbeeld(
  artnr: string,
  omschrijvingNl: string,
  voorraad: number | null,
  gereserveerd: number | null,
  voorraadMin: number | null,
  extra: Partial<AanvullingArtikel> = {},
): AanvullingArtikel {
  return {
    artnr, omschrijvingNl, voorraad, gereserveerd, voorraadMin,
    groep: "Profielen",
    leverancier: "Voorbeeldleverancier A",
    stock: true,
    geblokkeerd: false,
    externAantal: 0,
    externGereserveerd: 0,
    openInkoop: 0,
    bevestigdeLeverdatum: null,
    ...extra,
  };
}

const beslag = { groep: "Beslag", leverancier: "Voorbeeldleverancier B" };

const artikelen = [
  voorbeeld("VB-101", "Hoekprofiel wit", 8, 5, 5),
  voorbeeld("VB-102", "Hoekprofiel zwart", 8, 3, 5),
  voorbeeld("VB-103", "Hoekprofiel grijs", 8, null, 5),
  voorbeeld("VB-104", "Montageplaat klein", 20, 2, 6, beslag),
  voorbeeld("VB-105", "Afdekprofiel mat", 9, 2, null),
  voorbeeld("VB-106", "Montageplaat groot", 10, 7, 4, {
    ...beslag, externAantal: null, externGereserveerd: null,
  }),
  voorbeeld("VB-107", "Bevestigingsclip", 16, 2, 5, beslag),
  voorbeeld("VB-108", "Afdekprofiel glans", 12, 12, 5, {
    externAantal: 20, externGereserveerd: 4, openInkoop: 30,
  }),
  voorbeeld("VB-109", "Montagebeugel", 5, 7, null, {
    ...beslag, openInkoop: 10, bevestigdeLeverdatum: "2027-03-03",
  }),
  voorbeeld("VB-110", "Verbindingsplaat", 8, 0, 0, beslag),
  voorbeeld("VB-111", "Montagedienst", 0, 3, 5, { stock: false }),
  voorbeeld("VB-112", "Uitgefaseerd profiel", 0, 3, 5, { geblokkeerd: true }),
];

export const aanvullingFixtureBron: AanvullingBron = {
  async lees() {
    if (process.env.VOORRAAD_AANVULLING_FIXTURES === "disabled") return null;

    return {
      artikelen,
      peildatum: null,
      volledigheid: "volledig",
      actualiteit: "onbekend",
      bron: "voorbeeld",
    };
  },
};
