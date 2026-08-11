import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KlantDetailPage } from "../klant-detail-page";
import type { BonItem, KlantItem, OfferteItem } from "@/lib/api-client";

const mockKlant: KlantItem = {
  klnr: 14644,
  naam: "CONE LIGHTING BV",
  naam1: "",
  contact: "Jan Janssens",
  adres: "Catershoflaan 70-76",
  postnr: "2170",
  stad: "Merksem",
  land: "BE",
  tel: "03 123 45 67",
  fax: "",
  gsm: "",
  email: "info@conelighting.be",
  taal: "N",
  munt: "EUR",
  btwNr: "BE0123456789",
  saldo: 1234.56,
  geblokkeerd: false,
  opm: "",
};

const mockOffertes: OfferteItem[] = [];
const mockOrders: BonItem[] = [];

describe("KlantDetailPage", () => {
  it("renders the klant naam as heading and klnr", () => {
    render(
      <KlantDetailPage
        klant={mockKlant}
        offertes={mockOffertes}
        offertesPage={1}
        offertesHasMore={false}
        orders={mockOrders}
        ordersPage={1}
        ordersHasMore={false}
      />
    );
    expect(screen.getByRole("heading", { name: "CONE LIGHTING BV" })).toBeInTheDocument();
    expect(screen.getByText("Klantnr 14644")).toBeInTheDocument();
  });

  it("renders klant detail fields", () => {
    render(
      <KlantDetailPage
        klant={mockKlant}
        offertes={mockOffertes}
        offertesPage={1}
        offertesHasMore={false}
        orders={mockOrders}
        ordersPage={1}
        ordersHasMore={false}
      />
    );
    expect(screen.getByText("info@conelighting.be")).toBeInTheDocument();
    expect(screen.getByText("BE0123456789")).toBeInTheDocument();
    expect(screen.getByText("Nee")).toBeInTheDocument();
  });

  it("renders both the offertes and orders sections", () => {
    render(
      <KlantDetailPage
        klant={mockKlant}
        offertes={mockOffertes}
        offertesPage={1}
        offertesHasMore={false}
        orders={mockOrders}
        ordersPage={1}
        ordersHasMore={false}
      />
    );
    expect(screen.getByRole("heading", { name: "Offertes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
  });
});
