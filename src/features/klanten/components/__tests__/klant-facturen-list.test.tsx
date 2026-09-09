import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KlantFacturenList } from "../klant-facturen-list";
import type { FactuurItem } from "@/lib/api-client";

let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

const mockItems: FactuurItem[] = [
  {
    facnr: 991234,
    type: true,
    stempel: "",
    datum: "2026-05-01",
    klnr: 14644,
    naam: "CONE LIGHTING BV",
    adres: "Catershoflaan 70-76",
    postnr: "2170",
    stad: "Merksem",
    munt: "EUR",
    uRef: "",
    oRef: "",
    vervaldat: "2026-06-01",
    swBetaald: false,
    bdatum: null,
    nBedrag: 500,
    bBedrag: 605,
    totBtw: 105,
    totaal: 605,
    voorschot: 0,
    swFactuur: true,
    projectnr: 0,
    opm: "",
  },
];

describe("KlantFacturenList", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  it("renders the section heading", () => {
    render(<KlantFacturenList klnr={14644} items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Facturen" })).toBeInTheDocument();
  });

  it("renders every item's facnr and status", () => {
    render(<KlantFacturenList klnr={14644} items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByText("991234")).toBeInTheDocument();
    expect(screen.getByText("Openstaand")).toBeInTheDocument();
  });

  it("shows 'Betaald' when swBetaald is true", () => {
    render(
      <KlantFacturenList
        klnr={14644}
        items={[{ ...mockItems[0], swBetaald: true }]}
        page={1}
        hasMore={false}
      />
    );
    expect(screen.getByText("Betaald")).toBeInTheDocument();
  });

  it("shows an empty state when there are no items", () => {
    render(<KlantFacturenList klnr={14644} items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen facturen gevonden voor deze klant.")).toBeInTheDocument();
  });

  it("preserves existing query params (offertesPage/ordersPage) in its pagination links", () => {
    mockSearchParams = new URLSearchParams("offertesPage=2&ordersPage=3");
    render(<KlantFacturenList klnr={14644} items={mockItems} page={1} hasMore={true} />);
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
      "href",
      "/klanten/14644?offertesPage=2&ordersPage=3&facturenPage=2"
    );
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    mockSearchParams = new URLSearchParams("offertesPage=2&ordersPage=3&facturenPage=2");
    render(<KlantFacturenList klnr={14644} items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
      "href",
      "/klanten/14644?offertesPage=2&ordersPage=3&facturenPage=1"
    );
  });
});

