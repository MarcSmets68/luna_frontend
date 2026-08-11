import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OffertesPage } from "../offertes-page";
import type { OfferteItem } from "@/lib/api-client";

const mockItems: OfferteItem[] = [
  {
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
    offgroep: "",
    soort: "DNOM",
    passief: false,
    verloren: false,
    verkocht: false,
    verkoopkans: 0,
    uRef: "Test met kleuren voor RAL setup kost",
    besteldatum: null,
    verkochtdatum: null,
    opm: "",
  },
];

describe("OffertesPage", () => {
  it("renders the page heading", () => {
    render(<OffertesPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Alle offertes" })).toBeInTheDocument();
  });

  it("renders every item's offnr and naam", () => {
    render(<OffertesPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.offnr))).toBeInTheDocument();
      expect(screen.getByText(item.naam)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<OffertesPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen offertes gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<OffertesPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/offertes/alle?page=2");
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<OffertesPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/offertes/alle?page=1");
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });
});
