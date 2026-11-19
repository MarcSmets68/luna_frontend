import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PakbonAanmakenDialog, buildPakbonPayload } from "../pakbon-aanmaken-dialog";
import { ApiError } from "@/lib/api-client";
import type { BonItem, BonLijnItem } from "@/lib/api-client";

const createPakbonMock = vi.fn();
const createPaklijnMock = vi.fn();
const getBonLijnenMock = vi.fn();
const getKlantMock = vi.fn();
const deletePakbonMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createPakbon: (...args: unknown[]) => createPakbonMock(...args),
    createPaklijn: (...args: unknown[]) => createPaklijnMock(...args),
    getBonLijnen: (...args: unknown[]) => getBonLijnenMock(...args),
    getKlant: (...args: unknown[]) => getKlantMock(...args),
    deletePakbon: (...args: unknown[]) => deletePakbonMock(...args),
  };
});

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockBon: BonItem = {
  bonnr: 100,
  type: "ORDERBEVESTIGING",
  stempel: "A",
  datum: "2026-08-07",
  klnr: 14644,
  naam: "CONE LIGHTING BV",
  adres: "CATERSHOFLAAN 70-76",
  postnr: "2170",
  stad: "MERKSEM",
  munt: "EUR",
  bedrag: 0,
  btw: 0,
  uRef: "Ref",
  besteldatum: null,
  levDatum: null,
  geparkeerd: false,
  verzonden: false,
  opm: "",
  klnr2: 0,
  klnr3: 0,
  lnaam: "",
  lnaam1: "",
  ladres: "",
  lpostnr: "",
  lstad: "",
  recupelBedrag: 0,
  aBedrag: 0,
};

function lijn(overrides: Partial<BonLijnItem>): BonLijnItem {
  return {
    bonnr: 100,
    lijnnr: 1,
    stempel: "A",
    artnr: "ART-1",
    omschrijving: "Test lijn",
    aantal: 10,
    teLeveren: 10,
    besteld: 0,
    vprijs: 2,
    aprijs: 1,
    korting: 0,
    btwKode: "1",
    bedrag: 20,
    levDatum: null,
    bestelDatum: null,
    klnr: 14644,
    groepnr: 1,
    subgroepnr: 1,
    hold: false,
    opm: "",
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
    gereserv: 0,
    effectiefGereserv: 0,
    swEffectief: false,
    ...overrides,
  };
}

const mockLijnen: BonLijnItem[] = [
  lijn({ lijnnr: 1, artnr: "K00", omschrijving: "Titel" }),
  lijn({ lijnnr: 2, artnr: "ART-2", omschrijving: "Leverbaar", teLeveren: 10 }),
  lijn({ lijnnr: 3, artnr: "ART-3", omschrijving: "Al geleverd", teLeveren: 0 }),
  lijn({ lijnnr: 4, artnr: "ART-4", omschrijving: "Tweede leverbaar", teLeveren: 3, korting: 10 }),
];

function renderDialog(lijnen = mockLijnen) {
  return render(
    <PakbonAanmakenDialog bon={mockBon} lijnen={lijnen} open={true} onOpenChange={() => {}} />
  );
}

beforeEach(() => {
  createPakbonMock.mockReset();
  createPaklijnMock.mockReset();
  pushMock.mockReset();
  getBonLijnenMock.mockReset().mockResolvedValue(mockLijnen);
  getKlantMock.mockReset().mockResolvedValue({ naam1: "Factuur tweede naam" });
  deletePakbonMock.mockReset().mockResolvedValue({});
});

describe("PakbonAanmakenDialog", () => {
  it.each([
    [{}, { lnaam: mockBon.naam, ladres: mockBon.adres, lpostnr: mockBon.postnr, lstad: mockBon.stad }],
    [{ lnaam: " Magazijn ", ladres: "Straat", lpostnr: "1", lstad: "Gent" }, { lnaam: " Magazijn ", ladres: "Straat", lpostnr: "1", lstad: "Gent" }],
    [{ lnaam1: "Tweede naam" }, { lnaam: "", ladres: "", lpostnr: "", lstad: "" }],
    [{ ladres: "Losadres" }, { lnaam: "", ladres: "Losadres", lpostnr: "", lstad: "" }],
    [{ lnaam: "  " }, { lnaam: mockBon.naam, ladres: mockBon.adres, lpostnr: mockBon.postnr, lstad: mockBon.stad }],
  ])("maps complete or partial delivery addresses without mixing", (address, expected) => {
    const payload = buildPakbonPayload({ ...mockBon, ...address }, undefined, "Naam 2");
    expect(payload).toMatchObject({ ...expected, naam1: "Naam 2", naam: mockBon.naam, adres: mockBon.adres });
    expect(payload).not.toHaveProperty("lnaam1");
    expect(payload).not.toHaveProperty("paknr");
    expect(payload).not.toHaveProperty("projectnr");
  });

  it.each([null, new Error("Klant onbereikbaar")])("does not block on missing customer", async (klant) => {
    if (klant instanceof Error) getKlantMock.mockRejectedValue(klant);
    else getKlantMock.mockResolvedValue(klant);
    createPakbonMock.mockResolvedValue({ paknr: 123 });
    createPaklijnMock.mockResolvedValue({});
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/pakbonnen/123"));
    expect(createPakbonMock.mock.calls[0][0]).toMatchObject({ naam1: "" });
    expect(createPakbonMock.mock.calls[0][0]).not.toHaveProperty("paknr");
  });

  it("loads naam1 at submit and uses backend paknr", async () => {
    createPakbonMock.mockResolvedValue({ paknr: 123 });
    createPaklijnMock.mockResolvedValue({});
    renderDialog();
    expect(getKlantMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/pakbonnen/123"));
    expect(getKlantMock).toHaveBeenCalledWith(mockBon.klnr);
    expect(createPakbonMock.mock.calls[0][0]).toMatchObject({ naam1: "Factuur tweede naam" });
    expect(createPaklijnMock.mock.calls.every(([paknr]) => paknr === 123)).toBe(true);
  });

  it.each([new ApiError(409, "Conflict"), new Error("Backend niet bereikbaar")])("shows create errors", async (error) => {
    createPakbonMock.mockRejectedValue(error);
    renderDialog();
    await userEvent.type(screen.getByLabelText("Paknr"), "77");
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    expect(await screen.findByText(error instanceof ApiError ? "Pakbon 77 bestaat al. Kies een ander nummer of laat het veld leeg." : error.message)).toBeInTheDocument();
  });

  it.each(["0", "-2", "1.5"])("rejects invalid manual paknr %s", async (value) => {
    renderDialog();
    await userEvent.type(screen.getByLabelText("Paknr"), value);
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    expect(await screen.findByText("Vul een geldig paknr in (positief geheel getal).")).toBeInTheDocument();
    expect(createPakbonMock).not.toHaveBeenCalled();
  });

  it("shows all row errors together for fractional, empty and excessive quantities", async () => {
    const user = userEvent.setup();
    renderDialog([lijn({ lijnnr: 1 }), lijn({ lijnnr: 2 }), lijn({ lijnnr: 3 })]);
    for (const [nr, value] of [[1, "1.5"], [2, ""], [3, "11"]] as const) {
      const input = screen.getByLabelText(`Aantal voor lijn ${nr}`);
      expect(input).toHaveAttribute("step", "1");
      await user.clear(input);
      if (value) await user.type(input, value);
    }
    await user.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    expect(screen.getByText("Lijn 1: vul een positief geheel aantal in.")).toBeInTheDocument();
    expect(screen.getByText("Lijn 2: vul een positief geheel aantal in.")).toBeInTheDocument();
    expect(screen.getByText("Lijn 3: aantal (11) mag niet groter zijn dan te leveren (10).")).toBeInTheDocument();
    expect(createPakbonMock).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-1"])("rejects invalid quantity %s", async (value) => {
    renderDialog([lijn({})]);
    await userEvent.clear(screen.getByLabelText("Aantal voor lijn 1"));
    await userEvent.type(screen.getByLabelText("Aantal voor lijn 1"), value);
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    expect(screen.getByText("Lijn 1: vul een positief geheel aantal in.")).toBeInTheDocument();
    expect(createPakbonMock).not.toHaveBeenCalled();
  });

  it.each([[], [lijn({ lijnnr: 2, teLeveren: 2 })]].map((fresh) => ({ fresh })))("aborts when fresh lines are gone or insufficient", async ({ fresh }) => {
    getBonLijnenMock.mockResolvedValue(fresh);
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    expect(await screen.findByText(`Lijn 2: nog te leveren is ${fresh[0]?.teLeveren ?? 0}. Pas het aantal aan.`)).toBeInTheDocument();
    expect(screen.getByText("Lijn 4: nog te leveren is 0. Pas het aantal aan.")).toBeInTheDocument();
    expect(createPakbonMock).not.toHaveBeenCalled();
    expect(createPaklijnMock).not.toHaveBeenCalled();
  });

  it("keeps hold selectable but not preselected", async () => {
    renderDialog([lijn({ hold: true })]);
    expect(screen.getByText("Hold")).toHaveAttribute("title", "Lijn staat op hold");
    const checkbox = screen.getByLabelText("Lijn 1 opnemen in pakbon");
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("includes titles only for selected sections, in bon order, hiding special rows", async () => {
    const rows = [lijn({ lijnnr: 1, artnr: "K00", omschrijving: "Leeg" }), lijn({ lijnnr: 2, hold: true }), lijn({ lijnnr: 3, artnr: "K00", omschrijving: "Sectie" }), lijn({ lijnnr: 4 }), lijn({ lijnnr: 5, subtotaal: true, omschrijving: "Verborgen" }), lijn({ lijnnr: 6, kolomtitel: true }), lijn({ lijnnr: 7, infolijn: true })];
    getBonLijnenMock.mockResolvedValue(rows);
    createPakbonMock.mockResolvedValue({ paknr: 88 });
    createPaklijnMock.mockResolvedValue({});
    renderDialog(rows);
    expect(screen.queryByText("Verborgen")).not.toBeInTheDocument();
    expect(screen.getByText("Sectie")).toHaveAttribute("colspan", "6");
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(createPaklijnMock.mock.calls.map(([, payload]) => payload.blijnnr)).toEqual([3, 4]);
  });

  it("retries only missing lines on the same header and locks selection", async () => {
    createPakbonMock.mockResolvedValue({ paknr: 99 });
    createPaklijnMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("Fout")).mockResolvedValue({});
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    await screen.findByText(/Mislukt: 2/);
    expect(screen.getByLabelText("Lijn 2 opnemen in pakbon")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByLabelText("Aantal voor lijn 2")).toBeDisabled();
    expect(screen.getByLabelText("Paknr")).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Pakbon openen" }));
    expect(pushMock).toHaveBeenCalledWith("/pakbonnen/99");
    await userEvent.click(screen.getByRole("button", { name: "Ontbrekende lijnen opnieuw proberen" }));
    await waitFor(() => expect(createPaklijnMock).toHaveBeenCalledTimes(4));
    expect(createPaklijnMock.mock.calls.map(([nr, payload]) => [nr, payload.blijnnr])).toEqual([[99, 1], [99, 2], [99, 2], [99, 4]]);
    expect(createPakbonMock).toHaveBeenCalledTimes(1);
  });

  it("deletes an empty created pakbon", async () => {
    createPakbonMock.mockResolvedValue({ paknr: 99 });
    createPaklijnMock.mockRejectedValue(new Error("Fout"));
    const close = vi.fn();
    render(<PakbonAanmakenDialog bon={mockBon} lijnen={mockLijnen} open onOpenChange={close} />);
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    await userEvent.click(await screen.findByRole("button", { name: "Lege pakbon verwijderen" }));
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
    expect(deletePakbonMock).toHaveBeenCalledWith(99);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("aborts if reloading lines fails", async () => {
    getBonLijnenMock.mockRejectedValue(new Error("Lijnen onbereikbaar"));
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    expect(await screen.findByText("Lijnen onbereikbaar")).toBeInTheDocument();
    expect(createPakbonMock).not.toHaveBeenCalled();
  });

  it("keeps recovery available after a failed delete", async () => {
    createPakbonMock.mockResolvedValue({ paknr: 99 });
    createPaklijnMock.mockRejectedValue(new Error("Lijnfout"));
    deletePakbonMock.mockRejectedValue(new Error("Verwijderfout"));
    renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    await userEvent.click(await screen.findByRole("button", { name: "Lege pakbon verwijderen" }));
    expect(await screen.findByText("Verwijderfout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ontbrekende lijnen opnieuw proberen" })).toBeEnabled();
    expect(createPakbonMock).toHaveBeenCalledTimes(1);
  });
  it("only lists deliverable lines (no title lines, no teLeveren = 0), preselected with teLeveren", () => {
    renderDialog();

    expect(screen.getByText("Leverbaar")).toBeInTheDocument();
    expect(screen.getByText("Tweede leverbaar")).toBeInTheDocument();
    expect(screen.getByText("Titel")).toBeInTheDocument();
    expect(screen.queryByLabelText("Lijn 1 opnemen in pakbon")).not.toBeInTheDocument();
    expect(screen.queryByText("Al geleverd")).not.toBeInTheDocument();

    expect(screen.getByLabelText("Aantal voor lijn 2")).toHaveValue(10);
    expect(screen.getByLabelText("Aantal voor lijn 4")).toHaveValue(3);
  });

  it("creates the pakbon head then one paklijn per selected line and navigates to it", async () => {
    const user = userEvent.setup();
    createPakbonMock.mockResolvedValue({ paknr: 555 });
    createPaklijnMock.mockResolvedValue({});

    renderDialog();

    await user.type(screen.getByLabelText("Paknr"), "555");
    await user.click(screen.getByLabelText("Lijn 4 opnemen in pakbon"));
    const aantal = screen.getByLabelText("Aantal voor lijn 2");
    await user.clear(aantal);
    await user.type(aantal, "4");
    await user.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/pakbonnen/555"));

    expect(createPakbonMock).toHaveBeenCalledTimes(1);
    expect(createPakbonMock.mock.calls[0][0]).toMatchObject({
      paknr: 555,
      klnr: 14644,
      naam: "CONE LIGHTING BV",
      lnaam: "CONE LIGHTING BV",
      stempel: "A",
      uRef: "Ref",
    });

    expect(createPaklijnMock).toHaveBeenCalledTimes(2);
    expect(createPaklijnMock.mock.calls[0][1]).toMatchObject({ artnr: "K00", aantal: 0, teLeveren: 0, vprijs: 0, aprijs: 0, korting: 0, bedrag: 0, blijnnr: 1 });
    expect(createPaklijnMock).toHaveBeenCalledWith(
      555,
      expect.objectContaining({
        bonnr: 100,
        blijnnr: 2,
        artnr: "ART-2",
        aantal: 4,
        teLeveren: 4,
        afgehaald: 0,
        bedrag: 8,
      })
    );
  });

  it("rejects an aantal above teLeveren without calling the API", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Paknr"), "1");
    const aantal = screen.getByLabelText("Aantal voor lijn 4");
    await user.clear(aantal);
    await user.type(aantal, "5");
    await user.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));

    expect(
      await screen.findByText(
        "Lijn 4: aantal (5) mag niet groter zijn dan te leveren (3)."
      )
    ).toBeInTheDocument();
    expect(createPakbonMock).not.toHaveBeenCalled();
  });

  it("requires at least one selected line", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Paknr"), "7");
    await user.click(screen.getByLabelText("Lijn 2 opnemen in pakbon"));
    await user.click(screen.getByLabelText("Lijn 4 opnemen in pakbon"));
    await user.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    expect(await screen.findByText("Selecteer minstens één lijn.")).toBeInTheDocument();
    expect(createPakbonMock).not.toHaveBeenCalled();
  });

  it("reports partial success when a paklijn fails after the head was created", async () => {
    const user = userEvent.setup();
    createPakbonMock.mockResolvedValue({ paknr: 9 });
    createPaklijnMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Lijn geweigerd."));

    renderDialog();

    await user.type(screen.getByLabelText("Paknr"), "9");
    await user.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));

    expect(
      await screen.findByText(
        "Lijn geweigerd. Pakbon 9. Gelukt: 1. Mislukt: 2. Nog toe te voegen: 2, 4."
      )
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("warns that the head exists when the very first paklijn fails", async () => {
    const user = userEvent.setup();
    createPakbonMock.mockResolvedValue({ paknr: 9 });
    createPaklijnMock.mockRejectedValue(new Error("Lijn geweigerd."));

    renderDialog();

    await user.type(screen.getByLabelText("Paknr"), "9");
    await user.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));

    expect(
      await screen.findByText("Lijn geweigerd. Pakbon 9. Gelukt: geen. Mislukt: 1. Nog toe te voegen: 1, 2, 4.")
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows an empty state and disables the confirm button when nothing is deliverable", () => {
    renderDialog([lijn({ lijnnr: 1, teLeveren: 0 })]);

    expect(screen.getByText(/Geen leverbare lijnen/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pakbon aanmaken" })).toBeDisabled();
  });
});
