import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VoorraadPage } from "../voorraad-page";
import type { ArtikelItem } from "@/lib/api-client";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockItems: ArtikelItem[] = [
  {
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
    beschikbaar: 37,
    beschikbaarExtern: 28,
    onderMinimumIntern: false,
    onderMinimumExtern: false,
    magazijn: "MAG-A-12",
    voorraadMinExtern: 5,
    voorraadMaxExtern: 50,
    swExtern: true,
    swExProductie: false,
    isSamengesteld: false,
  },
];

describe("VoorraadPage", () => {
  it("renders the page heading", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Artikelen" })).toBeInTheDocument();
  });

  it("renders every item's artnr and omschrijving", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(item.artnr)).toBeInTheDocument();
      expect(screen.getByText(item.omschrijvingNl)).toBeInTheDocument();
    }
  });

  it("renders the Extern and Gereserveerd columns with their values", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("columnheader", { name: "Extern" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Gereserveerd" })).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders the onder-minimum and extern-in-bewerking filter checkboxes", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("shows an empty state when there are no items", () => {
    render(<VoorraadPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen artikelen gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<VoorraadPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/voorraad?page=2");
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<VoorraadPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/voorraad?page=1");
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });

  it("navigates to the artikel detail page when a row is clicked", () => {
    pushMock.mockClear();
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open artikel ab123/i });
    row.click();
    expect(pushMock).toHaveBeenCalledWith("/voorraad/AB123");
  });

  it("navigates to the artikel detail page when Enter is pressed on a focused row", () => {
    pushMock.mockClear();
    render(<VoorraadPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open artikel ab123/i });
    row.focus();
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(pushMock).toHaveBeenCalledWith("/voorraad/AB123");
  });
});
