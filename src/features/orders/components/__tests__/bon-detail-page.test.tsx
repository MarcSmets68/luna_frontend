import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BonDetailPage } from "../bon-detail-page";
import type { BonItem, BonLijnItem } from "@/lib/api-client";

const mockBon: BonItem = {
  bonnr: 1234567,
  type: "ORDERBEVESTIGING",
  stempel: "",
  datum: "2026-08-07",
  klnr: 14644,
  naam: "CONE LIGHTING BV",
  adres: "CATERSHOFLAAN 70-76",
  postnr: "2170",
  stad: "MERKSEM (ANTWERPEN)",
  munt: "EUR",
  bedrag: 624.49,
  btw: 108.38,
  uRef: "Test order",
  besteldatum: "2026-08-01",
  levDatum: "2026-08-20",
  geparkeerd: false,
  verzonden: false,
  opm: "",
};

const mockLijnen: BonLijnItem[] = [
  {
    bonnr: 1234567,
    lijnnr: 1,
    stempel: "",
    artnr: "ART-001",
    omschrijving: "LED profiel 2m",
    aantal: 10,
    teLeveren: 10,
    besteld: 0,
    vprijs: 45.5,
    aprijs: 45.5,
    korting: 0,
    btwKode: "1",
    bedrag: 455,
    levDatum: "2026-08-20",
    bestelDatum: "2026-08-01",
    klnr: 14644,
    groepnr: 1,
    subgroepnr: 1,
    hold: false,
    opm: "",
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
    gereserv: 10,
    effectiefGereserv: 10,
    swEffectief: false,
  },
];

const mockUnderReservedLijn: BonLijnItem = {
  ...mockLijnen[0],
  lijnnr: 2,
  artnr: "ART-002",
  omschrijving: "LED profiel 3m",
  teLeveren: 8,
  gereserv: 3,
  effectiefGereserv: 0,
  swEffectief: true,
};

const mockZeroNegativeLijn: BonLijnItem = {
  ...mockLijnen[0],
  lijnnr: 3,
  artnr: "ART-003",
  omschrijving: "LED profiel 1m",
  teLeveren: 0,
  gereserv: 0,
  effectiefGereserv: -1,
  swEffectief: false,
};

describe("BonDetailPage", () => {
  it("renders the bon heading and klant link", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.getByRole("heading", { name: "Bon 1234567" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CONE LIGHTING BV" })).toHaveAttribute(
      "href",
      "/klanten/14644"
    );
  });

  it("renders bon detail fields", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.getByText("Test order")).toBeInTheDocument();
    expect(screen.getByText("MERKSEM (ANTWERPEN)")).toBeInTheDocument();
  });

  it("renders the lijnen section with every line's artnr and omschrijving", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.getByRole("heading", { name: "Lijnen" })).toBeInTheDocument();
    for (const lijn of mockLijnen) {
      expect(screen.getByText(lijn.artnr)).toBeInTheDocument();
      expect(screen.getByText(lijn.omschrijving)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no lijnen", () => {
    render(<BonDetailPage bon={mockBon} lijnen={[]} />);
    expect(screen.getByText("Geen lijnen gevonden voor deze order.")).toBeInTheDocument();
  });

  it("renders a back link to the orders overview", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/orders/alle"
    );
  });

  it("renders the Gereserveerd and Eff. gereserveerd headers between Te leveren and Vprijs", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    const headers = screen.getAllByRole("columnheader").map((el) => el.textContent);
    const teLeverenIndex = headers.indexOf("Te leveren");
    const vprijsIndex = headers.indexOf("Vprijs");
    expect(headers[teLeverenIndex + 1]).toBe("Gereserveerd");
    expect(headers[teLeverenIndex + 2]).toBe("Eff. gereserveerd");
    expect(vprijsIndex).toBe(teLeverenIndex + 3);
  });

  it("highlights the Gereserveerd cell when effectively reserved and under-reserved", () => {
    render(<BonDetailPage bon={mockBon} lijnen={[mockUnderReservedLijn]} />);
    const cell = screen.getByText("3");
    expect(cell.className).toContain("bg-amber-100");
  });

  it("does not highlight the Gereserveerd cell when the line is not under-reserved", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    const cell = screen.getAllByText("10")[0];
    expect(cell.className).not.toContain("bg-amber-100");
  });

  it("renders zero and negative reservation values as plain numbers", () => {
    render(<BonDetailPage bon={mockBon} lijnen={[mockZeroNegativeLijn]} />);
    expect(screen.getByText("-1")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
});
