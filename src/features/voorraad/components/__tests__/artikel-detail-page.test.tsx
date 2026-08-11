import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtikelDetailPage } from "../artikel-detail-page";
import type { ArtikelItem } from "@/lib/api-client";

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

  it("shows a Stock badge when the artikel is in stock and no Geblokkeerd badge when it isn't blocked", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.queryByText("Geblokkeerd")).not.toBeInTheDocument();
  });

  it("shows a Geblokkeerd badge when the artikel is blocked", () => {
    render(<ArtikelDetailPage artikel={{ ...mockArtikel, geblokkeerd: true }} />);
    expect(screen.getByText("Geblokkeerd")).toBeInTheDocument();
  });
});
