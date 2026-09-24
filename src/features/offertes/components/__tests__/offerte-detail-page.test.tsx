import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfferteDetailPage } from "../offerte-detail-page";
import type { OfferteItem, OfflijnItem } from "@/lib/api-client";

const refreshMock = vi.fn();
const searchParamsMock = vi.fn(() => new URLSearchParams());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  useSearchParams: () => searchParamsMock(),
}));

const updateOfferteMock = vi.fn();
const omzettenNaarOrderMock = vi.fn();
const pushMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateOfferte: (...args: unknown[]) => updateOfferteMock(...args),
    omzettenNaarOrder: (...args: unknown[]) => omzettenNaarOrderMock(...args),
  };
});

beforeEach(() => {
  refreshMock.mockReset();
  updateOfferteMock.mockReset();
  omzettenNaarOrderMock.mockReset();
  pushMock.mockReset();
  searchParamsMock.mockReset();
  searchParamsMock.mockReturnValue(new URLSearchParams());
});

const mockOfferte: OfferteItem = {
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
  offgroep: "STD",
  soort: "DNOM",
  stempel: "O",
  passief: false,
  verloren: false,
  verkocht: false,
  verkoopkans: 50,
  uRef: "Test met kleuren voor RAL setup kost",
  besteldatum: "2026-08-01",
  verkochtdatum: null,
  opm: "",
};

const mockLijnen: OfflijnItem[] = [
  {
    offnr: 2167769,
    versie: 1,
    lijnnr: 1,
    groepnr: 1,
    subgroepnr: 1,
    artnr: "ART-001",
    omschrijving: "LED profiel 2m",
    omschrijvingOfferte: "LED profiel 2m - offerte tekst",
    aantal: 10,
    teLeveren: 10,
    verkoopprijs: 45.5,
    brutoVerkoopprijs: 50,
    korting: 0,
    btwKode: "1",
    bedrag: 455,
    bruto: 500,
    aankoopprijs: 30,
    opm: "",
    bestellen: false,
    blokkeren: false,
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
  },
];

const mockTitleLijn: OfflijnItem = {
  ...mockLijnen[0],
  lijnnr: 2,
  artnr: "K00",
  omschrijving: "SECTIE TITEL",
  // Real K00 lines come back from the backend with a whitespace-only
  // omschrijvingOfferte (e.g. "\n"), not an empty string. Reproduce that here
  // so the merged-cell test actually covers the reported bug scenario.
  omschrijvingOfferte: "\n",
};

describe("OfferteDetailPage", () => {
  it("renders the offerte heading and klant link", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByRole("heading", { name: "Offerte 2167769/1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CONE LIGHTING BV" })).toHaveAttribute(
      "href",
      "/klanten/14644"
    );
  });

  it("renders offerte detail fields", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByText("Test met kleuren voor RAL setup kost")).toBeInTheDocument();
    expect(screen.getByText("MERKSEM (ANTWERPEN)")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders the lijnen section with every line's artnr and omschrijving as editable inputs", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByRole("heading", { name: "Lijnen" })).toBeInTheDocument();
    for (const lijn of mockLijnen) {
      expect(screen.getByDisplayValue(lijn.artnr)).toBeInTheDocument();
      expect(screen.getByDisplayValue(lijn.omschrijvingOfferte)).toBeInTheDocument();
    }
  });

  it("shows a 'Geen lijnen' message when there are no lijnen", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={[]} />);
    expect(screen.getByText("Geen lijnen.")).toBeInTheDocument();
  });

  it("renders a back link to the offertes overview", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/offertes/alle"
    );
  });

  it("renders a K00 title line with the fallback description in the primary-600 color", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={[mockTitleLijn]} />);
    const input = screen.getByDisplayValue("SECTIE TITEL");
    expect(input.closest("td")).toHaveAttribute("colspan", "8");
    expect(input.closest("td")?.className).toContain("text-primary-600");
  });

  it("does not show editable header fields until 'Verbeteren' is clicked", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.queryByRole("textbox", { name: "Naam" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verbeteren" })).toBeInTheDocument();
  });

  it("switches to editable header fields after clicking 'Verbeteren', with offnr/versie/bedrag/btw staying read-only", async () => {
    const user = userEvent.setup();
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    expect(screen.getByRole("textbox", { name: "Naam" })).toHaveValue("CONE LIGHTING BV");
    expect(screen.getByText("Offnr")).toBeInTheDocument();
    expect(screen.getByText("2167769")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "Bedrag" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows the verloren help text in edit mode", async () => {
    const user = userEvent.setup();
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    expect(
      screen.getByText("Wordt bij opslaan automatisch uitgezet tenzij hier aangevinkt.")
    ).toBeInTheDocument();
  });

  it("saves the edited header fields and refreshes on success", async () => {
    const user = userEvent.setup();
    updateOfferteMock.mockResolvedValue({ ...mockOfferte, naam: "CONE LIGHTING NV" });

    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const naamInput = screen.getByRole("textbox", { name: "Naam" });
    await user.clear(naamInput);
    await user.type(naamInput, "CONE LIGHTING NV");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateOfferteMock).toHaveBeenCalledTimes(1));
    expect(updateOfferteMock).toHaveBeenCalledWith(
      2167769,
      1,
      expect.objectContaining({ naam: "CONE LIGHTING NV" })
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows an error and stays in edit mode when the update API call fails", async () => {
    const user = userEvent.setup();
    updateOfferteMock.mockRejectedValue(new Error("Offerte 2167769/1 not found"));

    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Offerte 2167769/1 not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("reads the partial-failure banner from sessionStorage when lijnFout=1", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("lijnFout=1"));
    const key = `luna:offerte-lijn-fout:${mockOfferte.offnr}:${mockOfferte.versie}`;
    sessionStorage.setItem(
      key,
      JSON.stringify({ failed: [{ omschrijving: "Ontbrekende lijn", error: "400 Bad Request" }] })
    );

    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);

    expect(
      screen.getByText(/Niet alle lijnen zijn opgeslagen/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Ontbrekende lijn: 400 Bad Request/)).toBeInTheDocument();
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it("does not show the partial-failure banner without lijnFout=1", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.queryByText(/Niet alle lijnen zijn opgeslagen/)).not.toBeInTheDocument();
  });

  it("shows an enabled 'Omzetten naar Order' button when offerte.stempel is 'O'", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    expect(screen.getByRole("button", { name: "Omzetten naar Order" })).toBeEnabled();
  });

  it("disables the 'Omzetten naar Order' button when offerte.stempel is not 'O'", () => {
    render(<OfferteDetailPage offerte={{ ...mockOfferte, stempel: "D" }} lijnen={mockLijnen} />);
    expect(screen.getByRole("button", { name: "Omzetten naar Order" })).toBeDisabled();
  });

  it("converts the offerte to an order and redirects to the new bon in edit mode", async () => {
    const user = userEvent.setup();
    omzettenNaarOrderMock.mockResolvedValue({
      bonnr: 48213,
      offnr: 2167769,
      versie: 1,
      offerteStempel: "D",
      aantalLijnenOvergenomen: 7,
      aantalLedLijnenOvergenomen: 3,
      totBtw: 214.37,
      totaalBasis: 887.1,
      totaalInclBtw: 1101.47,
    });

    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    await user.click(screen.getByRole("button", { name: "Omzetten naar Order" }));

    await waitFor(() => expect(omzettenNaarOrderMock).toHaveBeenCalledWith(2167769, 1));
    expect(pushMock).toHaveBeenCalledWith("/orders/48213?edit=1");
  });

  it("shows an inline error and does not redirect when the conversion fails", async () => {
    const user = userEvent.setup();
    omzettenNaarOrderMock.mockRejectedValue(
      new Error("Offerte 2167769/1 has stempel 'D' and cannot be converted")
    );

    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    await user.click(screen.getByRole("button", { name: "Omzetten naar Order" }));

    expect(
      await screen.findByText("Offerte 2167769/1 has stempel 'D' and cannot be converted")
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Offerte 2167769/1" })
    ).toBeInTheDocument();
  });
});
