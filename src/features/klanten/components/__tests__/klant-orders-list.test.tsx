import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KlantOrdersList } from "../klant-orders-list";
import type { BonItem } from "@/lib/api-client";

const mockItems: BonItem[] = [
  {
    bonnr: 458123,
    type: "ORDERBEVESTIGING",
    stempel: "O",
    datum: "2026-03-14",
    klnr: 10432,
    naam: "Van Damme NV",
    adres: "Kerkstraat 12",
    postnr: "9000",
    stad: "Gent",
    munt: "EUR",
    bedrag: 1284.5,
    btw: 269.75,
    uRef: "PO-2026-0091",
    besteldatum: "2026-03-10",
    levDatum: "2026-03-20",
    geparkeerd: false,
    verzonden: true,
    opm: "",
  },
];

describe("KlantOrdersList", () => {
  it("renders the section heading", () => {
    render(<KlantOrdersList klnr={10432} items={mockItems} page={1} hasMore={false} offertesPage={1} />);
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
  });

  it("renders every item's bonnr", () => {
    render(<KlantOrdersList klnr={10432} items={mockItems} page={1} hasMore={false} offertesPage={1} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.bonnr))).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<KlantOrdersList klnr={10432} items={[]} page={1} hasMore={false} offertesPage={1} />);
    expect(screen.getByText("Geen orders gevonden voor deze klant.")).toBeInTheDocument();
  });

  it("preserves offertesPage in its own pagination links", () => {
    render(<KlantOrdersList klnr={10432} items={mockItems} page={1} hasMore={true} offertesPage={2} />);
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
      "href",
      "/klanten/10432?offertesPage=2&ordersPage=2"
    );
  });

  it("shows an enabled 'Vorige' link on subsequent pages, preserving offertesPage", () => {
    render(<KlantOrdersList klnr={10432} items={mockItems} page={2} hasMore={false} offertesPage={5} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
      "href",
      "/klanten/10432?offertesPage=5&ordersPage=1"
    );
  });
});
