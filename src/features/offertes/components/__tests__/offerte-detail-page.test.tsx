import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfferteDetailPage } from "../offerte-detail-page";
import type { OfferteItem, OfflijnItem } from "@/lib/api-client";

const mockOfferte: OfferteItem = {
  offnr: 2167769,
  versie: 1,
  datum: "2026-08-07",
  klnr: 14644,
  naam: "CONE LIGHTING BV",
  adres: "CATERSHOFLAAN 70-76",
  postnr: "2170",
  stad: "MERKSEM (ANTWERPEN)",
  munt: "EUR",
  bedrag: 624.49,
  btw: 108.38,
  offgroep: "STD",
  soort: "DNOM",
  passief: false,
  verloren: false,
  verkocht: false,
  verkoopkans: 50,
  uRef: "Test met kleuren voor RAL setup kost",
  besteldatum: "2026-08-01",
  verkochtdatum: null,
  opm: "",
};

const mockLijnen: OfflijnItem[] = [
  {
    offnr: 2167769,
    versie: 1,
    lijnnr: 1,
    groepnr: 1,
    subgroepnr: 1,
    artnr: "ART-001",
    omschrijving: "LED profiel 2m",
    omschrijvingOfferte: "LED profiel 2m - offerte tekst",
    aantal: 10,
    teLeveren: 10,
    verkoopprijs: 45.5,
    brutoVerkoopprijs: 50,
    korting: 0,
    btwKode: "1",
    bedrag: 455,
    bruto: 500,
    aankoopprijs: 30,
    opm: "",
    bestellen: false,
    blokkeren: false,
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
  },
];

describe("OfferteDetailPage", () => {
  it("renders the offerte heading and klant link", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByRole("heading", { name: "Offerte 2167769/1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CONE LIGHTING BV" })).toHaveAttribute(
      "href",
      "/klanten/14644"
    );
  });

  it("renders offerte detail fields", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByText("Test met kleuren voor RAL setup kost")).toBeInTheDocument();
    expect(screen.getByText("MERKSEM (ANTWERPEN)")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders the lijnen section with every line's artnr and omschrijving", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByRole("heading", { name: "Lijnen" })).toBeInTheDocument();
    for (const lijn of mockLijnen) {
      expect(screen.getByText(lijn.artnr)).toBeInTheDocument();
      expect(screen.getByText(lijn.omschrijvingOfferte)).toBeInTheDocument();
    }
  });

  it("falls back to omschrijving when omschrijvingOfferte is empty", () => {
    const lijnenZonderOfferteTekst: OfflijnItem[] = [
      { ...mockLijnen[0], omschrijvingOfferte: "" },
    ];
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={lijnenZonderOfferteTekst} />);
    expect(screen.getByText("LED profiel 2m")).toBeInTheDocument();
  });

  it("shows an empty state when there are no lijnen", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={[]} />);
    expect(screen.getByText("Geen lijnen gevonden voor deze offerte.")).toBeInTheDocument();
  });

  it("renders a back link to the offertes overview", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/offertes/alle"
    );
  });
});
