import type { BesteldeRegel, LakordersData, TeBestellenRegel } from "./lakorder-werklijst";

function verschuifDag(vandaag: string, dagen: number): string {
  const datum = new Date(`${vandaag}T00:00:00Z`);
  datum.setUTCDate(datum.getUTCDate() + dagen);
  return datum.toISOString().slice(0, 10);
}

export function maakLakorderFixtures(vandaag: string): LakordersData {
  const dag = (dagen: number) => verschuifDag(vandaag, dagen);
  const zwart = {
    bron: "lopende-orders",
    bronreferentie: "1005 / 10",
    artnr: "DEMO-LAK-01",
    omschrijving: "Aluminium profiel",
    leverancier: "Voorbeeld Lak",
    behandeling: "Poederlak",
    kleurTechniekAfwerking: "Poederlak · RAL 9005 · Mat",
    openSaldo: 6,
  } satisfies Omit<TeBestellenRegel, "productiedeadline" | "status">;
  const brons: TeBestellenRegel = {
    bron: "lopende-productielijnen",
    bronreferentie: "1002 / 10 / 1",
    artnr: "DEMO-LAK-02",
    omschrijving: "Montagering",
    leverancier: "Voorbeeld Ano",
    behandeling: "Anodisatie",
    kleurTechniekAfwerking: "Anodisatie · Brons · Geborsteld",
    openSaldo: 2,
    productiedeadline: dag(3),
    status: "Deels gereserveerd",
  };
  const voorraad: TeBestellenRegel = {
    ...brons,
    bron: "min-max-voorraad",
    bronreferentie: null,
    artnr: "DEMO-LAK-03",
    omschrijving: "Montagebeugel",
    openSaldo: null,
    productiedeadline: null,
    status: null,
  };
  const bestelling: BesteldeRegel = {
    ...zwart,
    bronreferentie: "1009 / 10",
    artnr: "DEMO-LAK-05",
    bestellingsdatum: dag(-8),
    beloofdeLeverdatum: dag(-1),
    ontvangen: false,
    externeStap: "Bij de lakkerij",
  };

  return {
    teBestellen: {
      voorraad,
      // In dit proefgeval vertegenwoordigt alleen de productielijn de behoefte van 1002 / 10.
      montagering: brons,
      profiel: { ...zwart, productiedeadline: dag(1), status: "Nog te bestellen" },
      kap: {
        ...zwart,
        bronreferentie: "1006 / 10",
        artnr: "DEMO-LAK-04",
        omschrijving: "Afdekkap",
        openSaldo: 4,
        productiedeadline: dag(3),
        status: "Deels gereserveerd",
      },
    },
    besteld: {
      zonderBelofte: {
        ...bestelling,
        bronreferentie: "1013 / 10",
        artnr: "DEMO-LAK-08",
        leverancier: null,
        beloofdeLeverdatum: null,
        externeStap: null,
        openSaldo: null,
      },
      voorVandaag: {
        ...bestelling,
        bronreferentie: "1012 / 10",
        artnr: "DEMO-LAK-07",
        beloofdeLeverdatum: vandaag,
        externeStap: null,
      },
      teLaat: bestelling,
      onbekendeOntvangst: {
        ...bestelling,
        bronreferentie: "1010 / 10",
        artnr: "DEMO-LAK-06",
        ontvangen: null,
        externeStap: null,
      },
      afgehandeld: { ...bestelling, artnr: "DEMO-LAK-09", ontvangen: true, openSaldo: 0 },
    },
  };
}
