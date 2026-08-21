import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ArtikelDetailPage } from "../artikel-detail-page";
import type { ArtikelItem } from "@/lib/api-client";

const getArtikelBeschikbaarheidMock = vi.fn();
const getArtlogMock = vi.fn();

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    getArtikelBeschikbaarheid: (...args: unknown[]) => getArtikelBeschikbaarheidMock(...args),
    getArtlog: (...args: unknown[]) => getArtlogMock(...args),
  };
});

const mockArtikel: ArtikelItem = {
  artnr: "AB123",
  omschrijvingNl: "Testartikel",
  omschrijvingFr: "Article de test",
  merk: "MERK",
  groep: "GRP1",
  barcode: "1234567890123",
  munt: "EUR",
  btwKode: "1",
  aankoopprijs: 10,
  verkoopprijs: 15.5,
  verkoopprijsIncl: 18.76,
  voorraad: 42,
  voorraadMin: 5,
  voorraadMax: 100,
  stock: true,
  geblokkeerd: false,
  leverancierNr: 1,
  gewicht: 1.2,
  type: "STD",
  datum: "2026-01-01",
  voorraadExtern: 30,
  gereserveerd: 7,
  gereserveerdExtern: 2,
  beschikbaar: 35,
  beschikbaarExtern: 28,
  onderMinimumIntern: false,
  onderMinimumExtern: false,
  magazijn: "MAG-A-12",
  voorraadMinExtern: 5,
  voorraadMaxExtern: 50,
  swExtern: true,
  swExProductie: false,
  isSamengesteld: true,
};

describe("ArtikelDetailPage", () => {
  it("renders the omschrijving as heading and the artnr", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByRole("heading", { name: "Testartikel" })).toBeInTheDocument();
    expect(screen.getByText("Artikelnr AB123")).toBeInTheDocument();
  });

  it("renders artikel detail fields", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByText("MERK")).toBeInTheDocument();
    expect(screen.getByText("1234567890123")).toBeInTheDocument();
    expect(screen.getByText("Article de test")).toBeInTheDocument();
  });

  it("renders the algemeen, prijzen and voorraadinformatie sections", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByText("Algemeen")).toBeInTheDocument();
    expect(screen.getByText("Prijzen")).toBeInTheDocument();
    expect(screen.getByText("Voorraadinformatie")).toBeInTheDocument();
  });

  it("renders the FR-1 stock fields in the Voorraadinformatie section", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByText("Voorraad extern")).toBeInTheDocument();
    expect(screen.getByText("Locatie")).toBeInTheDocument();
    expect(screen.getByText("MAG-A-12")).toBeInTheDocument();
    expect(screen.getByText("Beschikbaar")).toBeInTheDocument();
  });

  it("renders the Overzicht/Beschikbaarheid/Bewegingen tabs", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByRole("tab", { name: "Overzicht" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Beschikbaarheid" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Bewegingen" })).toBeInTheDocument();
  });

  it("does not fetch beschikbaarheid/artlog until the corresponding tab is opened", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(getArtikelBeschikbaarheidMock).not.toHaveBeenCalled();
    expect(getArtlogMock).not.toHaveBeenCalled();
  });

  it("lazily fetches beschikbaarheid when the Beschikbaarheid tab is opened", async () => {
    getArtikelBeschikbaarheidMock.mockResolvedValue({
      artnr: "AB123",
      isSamengesteld: true,
      bouwbareEenheden: 3,
      siktaUitzonderingToegepast: false,
      componenten: [],
    });
    const user = userEvent.setup();
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    await user.click(screen.getByRole("tab", { name: "Beschikbaarheid" }));
    await waitFor(() => expect(getArtikelBeschikbaarheidMock).toHaveBeenCalledWith("AB123"));
  });

  it("lazily fetches artlog when the Bewegingen tab is opened", async () => {
    getArtlogMock.mockResolvedValue({ items: [], page: 1, pageSize: 25, hasMore: false });
    const user = userEvent.setup();
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    await user.click(screen.getByRole("tab", { name: "Bewegingen" }));
    await waitFor(() =>
      expect(getArtlogMock).toHaveBeenCalledWith("AB123", { page: 1, pageSize: 25 })
    );
  });

  it("shows a Stock badge when the artikel is in stock and no Geblokkeerd badge when it isn't blocked", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.queryByText("Geblokkeerd")).not.toBeInTheDocument();
  });

  it("shows a Geblokkeerd badge when the artikel is blocked", () => {
    render(<ArtikelDetailPage artikel={{ ...mockArtikel, geblokkeerd: true }} />);
    expect(screen.getByText("Geblokkeerd")).toBeInTheDocument();
  });

  it("renders a back link to the voorraad overview", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/voorraad"
    );
  });
});
