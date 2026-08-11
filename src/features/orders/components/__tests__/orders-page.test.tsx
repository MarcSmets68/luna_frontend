import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrdersPage } from "../orders-page";
import type { BonItem } from "@/lib/api-client";

const mockItems: BonItem[] = [
  {
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
  },
];

describe("OrdersPage", () => {
  it("renders the page heading", () => {
    render(<OrdersPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Alle orders" })).toBeInTheDocument();
  });

  it("renders every item's bonnr and naam", () => {
    render(<OrdersPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.bonnr))).toBeInTheDocument();
      expect(screen.getByText(item.naam)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<OrdersPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen orders gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<OrdersPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/orders/alle?page=2");
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<OrdersPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/orders/alle?page=1");
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });
});
