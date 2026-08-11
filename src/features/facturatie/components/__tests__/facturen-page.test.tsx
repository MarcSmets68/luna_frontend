import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FacturenPage } from "../facturen-page";
import type { FactuurItem } from "@/lib/api-client";

const mockItems: FactuurItem[] = [
  {
    facnr: 302145,
    type: true,
    stempel: "F",
    datum: "2026-08-07",
    klnr: 14644,
    naam: "CONE LIGHTING BV",
    adres: "CATERSHOFLAAN 70-76",
    postnr: "2170",
    stad: "MERKSEM (ANTWERPEN)",
    munt: "EUR",
    uRef: "PO-123",
    oRef: "",
    vervaldat: "2026-09-06",
    swBetaald: false,
    bdatum: null,
    nBedrag: 500,
    bBedrag: 500,
    totBtw: 105,
    totaal: 605,
    voorschot: 0,
    swFactuur: true,
    projectnr: 0,
    opm: "",
  },
];

describe("FacturenPage", () => {
  it("renders the page heading", () => {
    render(<FacturenPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Alle facturen" })).toBeInTheDocument();
  });

  it("renders every item's facnr and naam, linking to the detail page", () => {
    render(<FacturenPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.facnr))).toBeInTheDocument();
      expect(screen.getByText(item.naam)).toBeInTheDocument();
    }
    const links = screen.getAllByRole("link", { name: String(mockItems[0].facnr) });
    expect(links[0]).toHaveAttribute("href", `/facturatie/${mockItems[0].facnr}`);
  });

  it("shows 'Openstaand' for unpaid invoices and 'Betaald' for paid ones", () => {
    const paid: FactuurItem = { ...mockItems[0], facnr: 302146, swBetaald: true };
    render(<FacturenPage items={[mockItems[0], paid]} page={1} hasMore={false} />);
    expect(screen.getByText("Openstaand")).toBeInTheDocument();
    expect(screen.getAllByText("Betaald").length).toBeGreaterThan(1);
  });

  it("shows an empty state when there are no items", () => {
    render(<FacturenPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen facturen gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<FacturenPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
      "href",
      "/facturatie/alle?page=2"
    );
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<FacturenPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
      "href",
      "/facturatie/alle?page=1"
    );
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });
});
