import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KlantOffertesList } from "../klant-offertes-list";
import type { OfferteItem } from "@/lib/api-client";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

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
    uRef: "",
    besteldatum: null,
    verkochtdatum: null,
    opm: "",
  },
];

describe("KlantOffertesList", () => {
  it("renders the section heading", () => {
    render(<KlantOffertesList klnr={14644} items={mockItems} page={1} hasMore={false} ordersPage={1} />);
    expect(screen.getByRole("heading", { name: "Offertes" })).toBeInTheDocument();
  });

  it("renders every item's offnr", () => {
    render(<KlantOffertesList klnr={14644} items={mockItems} page={1} hasMore={false} ordersPage={1} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.offnr))).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<KlantOffertesList klnr={14644} items={[]} page={1} hasMore={false} ordersPage={1} />);
    expect(screen.getByText("Geen offertes gevonden voor deze klant.")).toBeInTheDocument();
  });

  it("preserves ordersPage in its own pagination links", () => {
    render(<KlantOffertesList klnr={14644} items={mockItems} page={1} hasMore={true} ordersPage={3} />);
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
      "href",
      "/klanten/14644?offertesPage=2&ordersPage=3"
    );
  });

  it("shows an enabled 'Vorige' link on subsequent pages, preserving ordersPage", () => {
    render(<KlantOffertesList klnr={14644} items={mockItems} page={2} hasMore={false} ordersPage={3} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
      "href",
      "/klanten/14644?offertesPage=1&ordersPage=3"
    );
  });

  it("navigates to the offerte detail page when a row is clicked", () => {
    pushMock.mockClear();
    render(<KlantOffertesList klnr={14644} items={mockItems} page={1} hasMore={false} ordersPage={1} />);
    const row = screen.getByRole("link", { name: /open offerte 2167769\/1/i });
    row.click();
    expect(pushMock).toHaveBeenCalledWith("/offertes/2167769/1");
  });

  it("navigates to the offerte detail page when Enter is pressed on a focused row", () => {
    pushMock.mockClear();
    render(<KlantOffertesList klnr={14644} items={mockItems} page={1} hasMore={false} ordersPage={1} />);
    const row = screen.getByRole("link", { name: /open offerte 2167769\/1/i });
    row.focus();
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(pushMock).toHaveBeenCalledWith("/offertes/2167769/1");
  });
});
