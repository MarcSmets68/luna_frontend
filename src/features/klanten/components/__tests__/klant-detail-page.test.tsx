import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { KlantDetailPage } from "../klant-detail-page";
import type {
  BonItem,
  FactuurItem,
  KlantAdresItem,
  KlantContactItem,
  KlantItem,
  KlantKortingItem,
  OfferteItem,
} from "@/lib/api-client";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(),
}));

const updateKlantMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateKlant: (...args: unknown[]) => updateKlantMock(...args),
  };
});

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
const mockAdressen: KlantAdresItem[] = [];
const mockContacten: KlantContactItem[] = [];
const mockKortingen: KlantKortingItem[] = [];
const mockFacturen: FactuurItem[] = [];

const defaultProps = {
  klant: mockKlant,
  offertes: mockOffertes,
  offertesPage: 1,
  offertesHasMore: false,
  orders: mockOrders,
  ordersPage: 1,
  ordersHasMore: false,
  adressen: mockAdressen,
  contacten: mockContacten,
  kortingen: mockKortingen,
  facturen: mockFacturen,
  facturenPage: 1,
  facturenHasMore: false,
};

beforeEach(() => {
  updateKlantMock.mockReset();
  refreshMock.mockReset();
});

describe("KlantDetailPage", () => {
  it("renders the klant naam as heading and klnr", () => {
    render(<KlantDetailPage {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "CONE LIGHTING BV" })).toBeInTheDocument();
    expect(screen.getByText("Klantnr 14644")).toBeInTheDocument();
  });

  it("renders klant detail fields on the 'Algemeen' tab", () => {
    render(<KlantDetailPage {...defaultProps} />);
    expect(screen.getByText("info@conelighting.be")).toBeInTheDocument();
    expect(screen.getByText("BE0123456789")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Geblokkeerd" })).not.toBeChecked();
  });

  it("groups the fields into the 'Algemeen' and 'Contact & Financieel' sections", () => {
    render(<KlantDetailPage {...defaultProps} />);
    expect(screen.getAllByText("Algemeen").length).toBeGreaterThan(0);
    expect(screen.getByText("Contact & Financieel")).toBeInTheDocument();
  });

  it("shows 'Geblokkeerd' as a disabled checkbox in the Kenmerken flag grid outside edit mode", () => {
    render(<KlantDetailPage {...defaultProps} />);
    expect(screen.getByText("Kenmerken")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Geblokkeerd" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("toggles the 'Geblokkeerd' checkbox in edit mode and includes it in the saved payload", async () => {
    const user = userEvent.setup();
    updateKlantMock.mockResolvedValue({ ...mockKlant, geblokkeerd: true });

    render(<KlantDetailPage {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    expect(screen.getByRole("checkbox", { name: "Geblokkeerd" })).not.toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: "Geblokkeerd" }));
    expect(screen.getByRole("checkbox", { name: "Geblokkeerd" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateKlantMock).toHaveBeenCalledTimes(1));
    expect(updateKlantMock).toHaveBeenCalledWith(
      14644,
      expect.objectContaining({ geblokkeerd: true })
    );
  });

  it("renders all 7 tabs", () => {
    render(<KlantDetailPage {...defaultProps} />);
    expect(screen.getByRole("tab", { name: "Algemeen" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Adressen" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Contactpersonen" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Offertes" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Financieel" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Kortingen" })).toBeInTheDocument();
  });

  it("shows the offertes section when the Offertes tab is activated", async () => {
    const user = userEvent.setup();
    render(<KlantDetailPage {...defaultProps} />);
    expect(screen.queryByRole("heading", { name: "Offertes" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Offertes" }));
    expect(screen.getByRole("heading", { name: "Offertes" })).toBeInTheDocument();
  });

  it("shows the orders section when the Orders tab is activated", async () => {
    const user = userEvent.setup();
    render(<KlantDetailPage {...defaultProps} />);

    await user.click(screen.getByRole("tab", { name: "Orders" }));
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
  });

  it("shows the facturen section when the Financieel tab is activated", async () => {
    const user = userEvent.setup();
    render(<KlantDetailPage {...defaultProps} />);

    await user.click(screen.getByRole("tab", { name: "Financieel" }));
    expect(screen.getByRole("heading", { name: "Facturen" })).toBeInTheDocument();
  });

  it("does not show editable fields until 'Verbeteren' is clicked", () => {
    render(<KlantDetailPage {...defaultProps} />);
    expect(screen.queryByRole("textbox", { name: "Naam" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verbeteren" })).toBeInTheDocument();
  });

  it("switches to editable fields after clicking 'Verbeteren', with klnr staying read-only", async () => {
    const user = userEvent.setup();
    render(<KlantDetailPage {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    expect(screen.getByRole("textbox", { name: "Naam" })).toHaveValue("CONE LIGHTING BV");
    expect(screen.getByText("Klantnr")).toBeInTheDocument();
    expect(screen.getByText("14644")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Klantnr" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows a 'Niet-bewaarde wijzigingen' dirty indicator once a field changes in edit mode", async () => {
    const user = userEvent.setup();
    render(<KlantDetailPage {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    expect(screen.queryByText("Niet-bewaarde wijzigingen")).not.toBeInTheDocument();

    const naamInput = screen.getByRole("textbox", { name: "Naam" });
    await user.type(naamInput, "!");

    expect(screen.getByText("Niet-bewaarde wijzigingen")).toBeInTheDocument();
  });

  it("saves the edited fields and refreshes on success", async () => {
    const user = userEvent.setup();
    updateKlantMock.mockResolvedValue({ ...mockKlant, naam: "CONE LIGHTING NV" });

    render(<KlantDetailPage {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    const naamInput = screen.getByRole("textbox", { name: "Naam" });
    await user.clear(naamInput);
    await user.type(naamInput, "CONE LIGHTING NV");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateKlantMock).toHaveBeenCalledTimes(1));
    expect(updateKlantMock).toHaveBeenCalledWith(
      14644,
      expect.objectContaining({ naam: "CONE LIGHTING NV", saldo: 1234.56 })
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("reverts changes and does not call the API on cancel", async () => {
    const user = userEvent.setup();
    render(<KlantDetailPage {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const naamInput = screen.getByRole("textbox", { name: "Naam" });
    await user.clear(naamInput);
    await user.type(naamInput, "Foutieve naam");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(updateKlantMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Naam" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CONE LIGHTING BV" })).toBeInTheDocument();
  });

  it("shows an error and stays in edit mode when the API call fails", async () => {
    const user = userEvent.setup();
    updateKlantMock.mockRejectedValue(new Error("Klant 14644 not found"));

    render(<KlantDetailPage {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Klant 14644 not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders a back link to the klanten overview", () => {
    render(<KlantDetailPage {...defaultProps} />);
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/klanten"
    );
  });
});
