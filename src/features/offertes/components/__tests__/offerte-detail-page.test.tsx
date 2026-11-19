import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfferteDetailPage } from "../offerte-detail-page";
import type { OfferteItem, OfflijnItem } from "@/lib/api-client";
import { confirmNavigation } from "@/lib/unsaved-changes";

const refreshMock = vi.fn();
const searchParamsMock = vi.fn(() => new URLSearchParams());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
  useSearchParams: () => searchParamsMock(),
}));

const updateOfferteMock = vi.fn();
const omzettenNaarOrderMock = vi.fn();
const pushMock = vi.fn();
const updateOfflijnMock = vi.fn();
const createOfflijnMock = vi.fn();
const deleteOfflijnMock = vi.fn();
const reorderOfflijnMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateOfferte: (...args: unknown[]) => updateOfferteMock(...args),
    omzettenNaarOrder: (...args: unknown[]) => omzettenNaarOrderMock(...args),
    updateOfflijn: (...args: unknown[]) => updateOfflijnMock(...args),
    createOfflijn: (...args: unknown[]) => createOfflijnMock(...args),
    deleteOfflijn: (...args: unknown[]) => deleteOfflijnMock(...args),
    reorderOfflijn: (...args: unknown[]) => reorderOfflijnMock(...args),
  };
});

beforeEach(() => {
  refreshMock.mockReset();
  updateOfferteMock.mockReset();
  omzettenNaarOrderMock.mockReset();
  pushMock.mockReset();
  searchParamsMock.mockReset();
  searchParamsMock.mockReturnValue(new URLSearchParams());
  updateOfflijnMock.mockReset();
  createOfflijnMock.mockReset();
  deleteOfflijnMock.mockReset();
  reorderOfflijnMock.mockReset();
  vi.spyOn(window, "confirm").mockReturnValue(true);
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
    expect(screen.getByRole("button", { name: "Opslaan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annuleren" })).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Opslaan" }));

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
    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    expect(await screen.findByText("Offerte 2167769/1 not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Opslaan" })).toBeInTheDocument();
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
    expect(screen.getByText("Alleen open offertes kunnen omgezet worden.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Omzetten naar Order" })).toHaveAccessibleDescription(
      "Alleen open offertes kunnen omgezet worden."
    );
  });

  it("explains line autosave without showing a conversion restriction on open offers", () => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={[]} />);
    expect(screen.getByText("Wijzigingen aan lijnen worden automatisch opgeslagen.")).toBeVisible();
    expect(screen.queryByText("Alleen open offertes kunnen omgezet worden.")).not.toBeInTheDocument();
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
    expect(window.confirm).toHaveBeenCalledWith("Offerte 2167769/1 omzetten naar order?");
    expect(pushMock).toHaveBeenCalledWith("/orders/48213?edit=1");
  });

  it("does not convert when confirmation is cancelled", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Omzetten naar Order" }));
    expect(omzettenNaarOrderMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Omzetten naar Order" })).toBeEnabled();
  });

  it("sends explicit nulls when clearing both commercial dates", async () => {
    render(<OfferteDetailPage offerte={{ ...mockOfferte, verkochtdatum: "2026-08-02" }} lijnen={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Verbeteren" }));
    fireEvent.change(screen.getByLabelText("Besteldatum"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Verkoopdatum"), { target: { value: "" } });
    await userEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    expect(updateOfferteMock).toHaveBeenCalledWith(2167769, 1,
      expect.objectContaining({ besteldatum: null, verkochtdatum: null }));
    expect(JSON.parse(JSON.stringify(updateOfferteMock.mock.calls[0][2]))).toMatchObject({
      besteldatum: null, verkochtdatum: null,
    });
  });

  it.each(["", "-1", "101", "12.5"])("rejects invalid verkoopkans %s", async (value) => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Verbeteren" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Verkoopkans" }), { target: { value } });
    await userEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    expect(screen.getByText("Verkoopkans moet een geheel getal tussen 0 en 100 zijn.")).toBeInTheDocument();
    expect(updateOfferteMock).not.toHaveBeenCalled();
  });

  it.each([0, 75, 100])("accepts whole verkoopkans %s", async (value) => {
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Verbeteren" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Verkoopkans" }), { target: { value: String(value) } });
    await userEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    expect(updateOfferteMock).toHaveBeenCalledWith(2167769, 1, expect.objectContaining({ verkoopkans: value }));
  });

  it.each(["add", "update", "delete", "reorder"])("refreshes server totals after line %s", async (mutation) => {
    const lines = [mockLijnen[0], { ...mockLijnen[0], lijnnr: 2 }];
    updateOfflijnMock.mockResolvedValue({ ...lines[0], aantal: 12 });
    createOfflijnMock.mockResolvedValue({ ...lines[0], lijnnr: 3 });
    deleteOfflijnMock.mockResolvedValue({ status: "ok" });
    reorderOfflijnMock.mockResolvedValue([...lines].reverse());
    const { rerender } = render(<OfferteDetailPage offerte={mockOfferte} lijnen={lines} />);
    if (mutation === "add") {
      await userEvent.click(screen.getByRole("button", { name: "Lijn toevoegen" }));
    } else if (mutation === "update") {
      fireEvent.change(screen.getByRole("spinbutton", { name: "Aantal lijn 1" }), { target: { value: "12" } });
      fireEvent.blur(screen.getByRole("spinbutton", { name: "Aantal lijn 1" }));
    } else if (mutation === "delete") {
      await userEvent.click(screen.getByRole("button", { name: "Verwijder lijn 1" }));
    } else {
      await userEvent.click(screen.getAllByRole("button", { name: "Omlaag" })[0]);
    }
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    rerender(<OfferteDetailPage offerte={{ ...mockOfferte, bedrag: 900, btw: 189 }} lijnen={[]} />);
    expect(screen.getByText("900,00")).toBeInTheDocument();
    expect(screen.getByText("189,00")).toBeInTheDocument();
    expect(screen.getByText("Geen lijnen.")).toBeInTheDocument();
  });

  it("keeps unsaved header and line edits and their guards on refreshed props", async () => {
    const { rerender } = render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    await userEvent.click(screen.getByRole("button", { name: "Verbeteren" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Naam" }), { target: { value: "Niet opgeslagen" } });
    fireEvent.focus(screen.getByRole("spinbutton", { name: "Aantal lijn 1" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Aantal lijn 1" }), { target: { value: "15" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" }), { target: { value: "Nieuwe conceptlijn" } });
    rerender(<OfferteDetailPage offerte={{ ...mockOfferte, bedrag: 900, btw: 189 }} lijnen={[{ ...mockLijnen[0], aantal: 11 }]} />);
    expect(screen.getByRole("textbox", { name: "Naam" })).toHaveValue("Niet opgeslagen");
    expect(screen.getByRole("spinbutton", { name: "Aantal lijn 1" })).toHaveValue(15);
    expect(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" })).toHaveValue("Nieuwe conceptlijn");
    expect(screen.getByText("900,00")).toBeInTheDocument();
    vi.mocked(window.confirm).mockReturnValue(false);
    expect(confirmNavigation()).toBe(false);
    expect(updateOfflijnMock).not.toHaveBeenCalled();
  });

  describe.each(["update", "add", "delete", "reorder"])("overlapping update and %s", (mutation) => {
    it.each([true, false])("preserves both results when the second request finishes first: %s", async (secondFirst) => {
      let resolveFirst!: (value: OfflijnItem) => void;
      let resolveSecond!: (value: unknown) => void;
      const first = new Promise<OfflijnItem>((resolve) => { resolveFirst = resolve; });
      const second = new Promise<unknown>((resolve) => { resolveSecond = resolve; });
      const lines = [mockLijnen[0], { ...mockLijnen[0], lijnnr: 2, artnr: "ART-002" }];
      const added = { ...mockLijnen[0], lijnnr: 3, artnr: "ART-003" };
      const updatedFirst = { ...lines[0], aantal: 12, bedrag: 888 };
      const updatedSecond = { ...lines[1], aantal: 14, bedrag: 777 };
      updateOfflijnMock.mockReturnValueOnce(first).mockReturnValueOnce(second);
      createOfflijnMock.mockReturnValue(second);
      deleteOfflijnMock.mockReturnValue(second);
      reorderOfflijnMock.mockReturnValue(second);
      render(<OfferteDetailPage offerte={mockOfferte} lijnen={lines} />);
      const firstInput = screen.getByRole("spinbutton", { name: "Aantal lijn 1" });
      fireEvent.change(firstInput, { target: { value: "12" } });
      fireEvent.blur(firstInput);
      if (mutation === "update") {
        const input = screen.getByRole("spinbutton", { name: "Aantal lijn 2" });
        fireEvent.change(input, { target: { value: "14" } });
        fireEvent.blur(input);
      } else if (mutation === "add") {
        await userEvent.click(screen.getByRole("button", { name: "Lijn toevoegen" }));
      } else if (mutation === "delete") {
        await userEvent.click(screen.getByRole("button", { name: "Verwijder lijn 2" }));
      } else {
        await userEvent.click(screen.getAllByRole("button", { name: "Omhoog" })[1]);
      }
      expect(updateOfflijnMock).toHaveBeenCalledTimes(mutation === "update" ? 2 : 1);
      if (mutation === "add") expect(createOfflijnMock).toHaveBeenCalledTimes(1);
      if (mutation === "delete") expect(deleteOfflijnMock).toHaveBeenCalledTimes(1);
      if (mutation === "reorder") expect(reorderOfflijnMock).toHaveBeenCalledTimes(1);
      const secondResult = mutation === "update" ? updatedSecond
        : mutation === "add" ? added
        : mutation === "reorder" ? [...lines].reverse() : {};
      if (secondFirst) {
        await act(async () => { resolveSecond(secondResult); });
        expect(screen.getByRole("spinbutton", { name: "Aantal lijn 1" })).toBeDisabled();
        await act(async () => { resolveFirst(updatedFirst); });
      } else {
        await act(async () => { resolveFirst(updatedFirst); });
        await act(async () => { resolveSecond(secondResult); });
      }
      expect(screen.getByRole("spinbutton", { name: "Bedrag lijn 1" })).toHaveValue(888);
      if (mutation === "update") expect(screen.getByRole("spinbutton", { name: "Bedrag lijn 2" })).toHaveValue(777);
      if (mutation === "add") expect(screen.getByRole("textbox", { name: "Artnr lijn 3" })).toHaveValue("ART-003");
      if (mutation === "delete") expect(screen.queryByRole("textbox", { name: "Artnr lijn 2" })).not.toBeInTheDocument();
      if (mutation === "reorder") expect(screen.getAllByRole("textbox", { name: /^Artnr lijn/ }).map((input) => (input as HTMLInputElement).value)).toEqual(["ART-002", "ART-001"]);
      expect(refreshMock).toHaveBeenCalledTimes(2);
      expect(screen.getAllByRole("status").some((status) => status.textContent === "Opgeslagen")).toBe(true);
    });
  });

  it("does not refresh when a line mutation fails", async () => {
    updateOfflijnMock.mockRejectedValue(new Error("Opslaan mislukt"));
    render(<OfferteDetailPage offerte={mockOfferte} lijnen={mockLijnen} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Aantal lijn 1" }), { target: { value: "12" } });
    fireEvent.blur(screen.getByRole("spinbutton", { name: "Aantal lijn 1" }));
    expect(await screen.findByText("Opslaan mislukt")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
    expect(screen.getByRole("spinbutton", { name: "Aantal lijn 1" })).toHaveValue(12);
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
