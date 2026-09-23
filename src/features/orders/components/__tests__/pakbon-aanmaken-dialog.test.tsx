import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PakbonAanmakenDialog } from "../pakbon-aanmaken-dialog";
import type { BonItem, BonLijnItem } from "@/lib/api-client";

const createPakbonMock = vi.fn();
const createPaklijnMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createPakbon: (...args: unknown[]) => createPakbonMock(...args),
    createPaklijn: (...args: unknown[]) => createPaklijnMock(...args),
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
});

describe("PakbonAanmakenDialog", () => {
  it("only lists deliverable lines (no title lines, no teLeveren = 0), preselected with teLeveren", () => {
    renderDialog();

    expect(screen.getByText("Leverbaar")).toBeInTheDocument();
    expect(screen.getByText("Tweede leverbaar")).toBeInTheDocument();
    expect(screen.queryByText("Titel")).not.toBeInTheDocument();
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

    expect(createPaklijnMock).toHaveBeenCalledTimes(1);
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

  it("requires a paknr and at least one selected line", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Pakbon aanmaken" }));
    expect(
      await screen.findByText("Vul een geldig paknr in (positief geheel getal).")
    ).toBeInTheDocument();

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
        "Lijn geweigerd. Pakbon 9 is aangemaakt met lijn(en) 2; de overige lijnen zijn niet toegevoegd."
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
      await screen.findByText("Lijn geweigerd. Pakbon 9 is aangemaakt maar bevat nog geen lijnen.")
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows an empty state and disables the confirm button when nothing is deliverable", () => {
    renderDialog([lijn({ lijnnr: 1, teLeveren: 0 })]);

    expect(screen.getByText(/Geen leverbare lijnen/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pakbon aanmaken" })).toBeDisabled();
  });
});
