import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfferteDetailPage } from "../offerte-detail-page";
import type { OfferteItem, OfflijnItem } from "@/lib/api-client";

const refreshMock = vi.fn();
const searchParamsMock = vi.fn(() => new URLSearchParams());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
  useSearchParams: () => searchParamsMock(),
}));

const updateOfferteMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateOfferte: (...args: unknown[]) => updateOfferteMock(...args),
  };
});

beforeEach(() => {
  refreshMock.mockReset();
  updateOfferteMock.mockReset();
  searchParamsMock.mockReset();
  searchParamsMock.mockReturnValue(new URLSearchParams());
});

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

const mockTitleLijn: OfflijnItem = {
  ...mockLijnen[0],
  lijnnr: 2,
  artnr: "K00",
  omschrijving: "SECTIE TITEL",
  // Real K00 lines come back from the backend with a whitespace-only
  // omschrijvingOfferte (e.g. "\n"), not an empty string. Reproduce that here
  // so the merged-cell test actually covers the reported bug scenario.
  omschrijvingOfferte: "\n",
};

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

  it("renders the lijnen section with every line's artnr and omschrijving as editable inputs", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByRole("heading", { name: "Lijnen" })).toBeInTheDocument();
    for (const lijn of mockLijnen) {
      expect(screen.getByDisplayValue(lijn.artnr)).toBeInTheDocument();
      expect(screen.getByDisplayValue(lijn.omschrijvingOfferte)).toBeInTheDocument();
    }
  });

  it("falls back to omschrijving when omschrijvingOfferte is empty", () => {
    const lijnenZonderOfferteTekst: OfflijnItem[] = [
      { ...mockLijnen[0], omschrijvingOfferte: "" },
    ];
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={lijnenZonderOfferteTekst} />);
    expect(screen.getByText("LED profiel 2m")).toBeInTheDocument();
  });

  it("falls back to omschrijving when omschrijvingOfferte is whitespace-only", () => {
    const lijnenMetWhitespaceOfferteTekst: OfflijnItem[] = [
      { ...mockLijnen[0], omschrijvingOfferte: "\n" },
    ];
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={lijnenMetWhitespaceOfferteTekst} />);
    expect(screen.getByText("LED profiel 2m")).toBeInTheDocument();
  });

  it("shows an empty state when there are no lijnen", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={[]} />);
    expect(screen.getByText("Geen lijnen.")).toBeInTheDocument();
  });

  it("renders a back link to the offertes overview", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/offertes/alle"
    );
  });

  it("collapses a K00 line to a single merged cell in the primary-600 title-line color", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={[mockTitleLijn]} />);
    const cell = screen.getByText("SECTIE TITEL");
    expect(cell.className).toContain("text-primary-600");
    expect(cell.tagName).toBe("TD");
    expect(cell).toHaveAttribute("colspan", "9");
    expect(screen.queryByText("2")).not.toBeInTheDocument();
    expect(screen.queryByText("K00")).not.toBeInTheDocument();
  });

  it("does not apply the title-line color to a normal article row", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByText(mockLijnen[0].artnr).className).not.toContain("text-primary-600");
    expect(screen.getByText(mockLijnen[0].omschrijvingOfferte).className).not.toContain(
      "text-primary-600"
    );
  });
});
