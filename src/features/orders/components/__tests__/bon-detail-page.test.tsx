import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BonDetailPage } from "../bon-detail-page";
import type { BonItem, BonLijnItem } from "@/lib/api-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const mockBon: BonItem = {
  bonnr: 1234567,
  type: "ORDERBEVESTIGING",
  stempel: "V",
  datum: "2026-08-07",
  klnr: 14644,
  klnr2: 0,
  klnr3: 0,
  naam: "CONE LIGHTING BV",
  adres: "CATERSHOFLAAN 70-76",
  postnr: "2170",
  stad: "MERKSEM (ANTWERPEN)",
  lnaam: "",
  lnaam1: "",
  ladres: "",
  lpostnr: "",
  lstad: "",
  munt: "EUR",
  bedrag: 624.49,
  btw: 108.38,
  recupelBedrag: 0,
  aBedrag: 0,
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
  },
];

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

  it("shows the status badge for the bon's stempel", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.getByText("In verwerking")).toBeInTheDocument();
  });

  it("shows the annuleer-actie button, enabled for a non-open stempel", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.getByRole("button", { name: "Annuleer order" })).toBeEnabled();
  });

  it("does not render Klnr2/Klnr3 when they are 0", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.queryByText("Klnr2")).not.toBeInTheDocument();
    expect(screen.queryByText("Klnr3")).not.toBeInTheDocument();
  });

  it("renders Klnr2/Klnr3 when present", () => {
    render(<BonDetailPage bon={{ ...mockBon, klnr2: 111, klnr3: 222 }} lijnen={mockLijnen} />);
    expect(screen.getByText("Klnr2")).toBeInTheDocument();
    expect(screen.getByText("111")).toBeInTheDocument();
    expect(screen.getByText("Klnr3")).toBeInTheDocument();
    expect(screen.getByText("222")).toBeInTheDocument();
  });

  it("does not render an afleveradres section when all its fields are empty", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.queryByText("Afleveradres")).not.toBeInTheDocument();
  });

  it("renders the afleveradres section when at least one field is present", () => {
    render(
      <BonDetailPage
        bon={{
          ...mockBon,
          lnaam: "Magazijn West",
          lnaam1: "",
          ladres: "Havenlaan 1",
          lpostnr: "2000",
          lstad: "Antwerpen",
        }}
        lijnen={mockLijnen}
      />
    );
    expect(screen.getByText("Afleveradres")).toBeInTheDocument();
    expect(screen.getByText("Magazijn West")).toBeInTheDocument();
    expect(screen.getByText("Havenlaan 1")).toBeInTheDocument();
    expect(screen.getByText("2000 Antwerpen")).toBeInTheDocument();
  });
});
