import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BonDetailPage } from "../bon-detail-page";
import type { BonItem, BonLijnItem } from "@/lib/api-client";

const pushMock = vi.fn();
const refreshMock = vi.fn();
<<<<<<< Updated upstream
const updateBonMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateBon: (...args: unknown[]) => updateBonMock(...args),
  };
});

=======
>>>>>>> Stashed changes
const searchParamsMock = vi.fn(() => new URLSearchParams());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => searchParamsMock(),
}));

<<<<<<< Updated upstream
=======
const updateBonMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateBon: (...args: unknown[]) => updateBonMock(...args),
  };
});

>>>>>>> Stashed changes
// Flushes the microtask queue so the per-row BonlijnPakbonBadge fetch (and
// its resulting setState) settles before assertions run - avoids the
// "not wrapped in act(...)" warning without changing test intent.
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

// BonDetailPage's LED-configuratie tab and per-row pakbon-badges fetch on
// mount via the shared API client - stub fetch so every test gets a
// deterministic empty response instead of a real network call.
function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) })
  );
}

beforeEach(() => {
  searchParamsMock.mockReset();
  searchParamsMock.mockReturnValue(new URLSearchParams());
  sessionStorage.clear();
  pushMock.mockReset();
  refreshMock.mockReset();
  updateBonMock.mockReset();
});

const mockBon: BonItem = {
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

const mockLijnen: BonLijnItem[] = [
  {
    bonnr: 1234567,
    lijnnr: 1,
    stempel: "",
    artnr: "ART-001",
    omschrijving: "LED profiel 2m",
    aantal: 10,
    teLeveren: 10,
    besteld: 0,
    vprijs: 45.5,
    aprijs: 45.5,
    korting: 0,
    btwKode: "1",
    bedrag: 455,
    levDatum: "2026-08-20",
    bestelDatum: "2026-08-01",
    klnr: 14644,
    groepnr: 1,
    subgroepnr: 1,
    hold: false,
    opm: "",
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
    gereserv: 5,
    effectiefGereserv: 5,
    swEffectief: true,
  },
];

const mockUnderReservedLijn: BonLijnItem = {
  ...mockLijnen[0],
  lijnnr: 2,
  artnr: "ART-002",
  omschrijving: "LED profiel 3m",
  teLeveren: 8,
  gereserv: 3,
  effectiefGereserv: 0,
  swEffectief: true,
};

const mockNotUnderReservedLijn: BonLijnItem = {
  ...mockLijnen[0],
  lijnnr: 4,
  artnr: "ART-004",
  omschrijving: "LED profiel 4m",
  gereserv: 12,
  effectiefGereserv: 6,
  swEffectief: true,
};

const mockZeroNegativeLijn: BonLijnItem = {
  ...mockLijnen[0],
  lijnnr: 3,
  artnr: "ART-003",
  omschrijving: "LED profiel 1m",
  teLeveren: 0,
  gereserv: 0,
  effectiefGereserv: -1,
  swEffectief: false,
};

const mockTitleLijn: BonLijnItem = {
  ...mockLijnen[0],
  lijnnr: 5,
  artnr: " k00 ",
  omschrijving: "SECTIE TITEL",
};

describe("BonDetailPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the bon heading and klant link", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.getByRole("heading", { name: "Bon 1234567" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CONE LIGHTING BV" })).toHaveAttribute(
      "href",
      "/klanten/14644"
    );
  });

  it("renders bon detail fields", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.getByText("Test order")).toBeInTheDocument();
    expect(screen.getByText("MERKSEM (ANTWERPEN)")).toBeInTheDocument();
  });

  it("renders the lijnen section with every line's artnr and omschrijving", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.getByRole("heading", { name: "Lijnen" })).toBeInTheDocument();
    for (const lijn of mockLijnen) {
      expect(screen.getByText(lijn.artnr)).toBeInTheDocument();
      expect(screen.getByText(lijn.omschrijving)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no lijnen", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={[]} />);
    await flush();
    expect(screen.getByText("Geen lijnen gevonden voor deze order.")).toBeInTheDocument();
  });

  it("renders a back link to the orders overview", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/orders/alle"
    );
  });

  it("shows the Herstel tab only for bon.type HERSTELLING", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.queryByRole("tab", { name: "Herstel" })).not.toBeInTheDocument();

    render(<BonDetailPage bon={{ ...mockBon, type: "HERSTELLING" }} lijnen={mockLijnen} />);
    await flush();
    expect(screen.getByRole("tab", { name: "Herstel" })).toBeInTheDocument();
  });

  it("renders the reservering columns for every lijn", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.getByRole("button", { name: "Reserveren" })).toBeInTheDocument();
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
  });

  it("renders the Gereserveerd and Eff. gereserveerd headers between Te leveren and Vprijs", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    const headers = screen.getAllByRole("columnheader").map((el) => el.textContent);
    const teLeverenIndex = headers.indexOf("Te leveren");
    const vprijsIndex = headers.indexOf("Vprijs");
    expect(headers[teLeverenIndex + 1]).toBe("Gereserveerd");
    expect(headers[teLeverenIndex + 2]).toBe("Eff. gereserveerd");
    expect(vprijsIndex).toBe(teLeverenIndex + 3);
  });

  it("highlights the Gereserveerd cell when effectively reserved and under-reserved", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={[mockUnderReservedLijn]} />);
    await flush();
    const cell = screen.getByText("3");
    expect(cell.className).toContain("bg-amber-100");
  });

  it("does not highlight the Gereserveerd cell when the line is not under-reserved", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={[mockNotUnderReservedLijn]} />);
    await flush();
    const cell = screen.getByText("12");
    expect(cell.className).not.toContain("bg-amber-100");
  });

  it("renders zero and negative reservation values as plain numbers", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={[mockZeroNegativeLijn]} />);
    await flush();
    expect(screen.getByText("-1")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("collapses a K00 line to a single merged cell in the primary-600 title-line color", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={[mockTitleLijn]} />);
    await flush();
    const cell = screen.getByText("SECTIE TITEL");
    expect(cell.className).toContain("text-primary-600");
    expect(cell.tagName).toBe("TD");
    // 13 columns in the merged fase2+lijn-fout table: chevron, Lijnnr, Artnr,
    // Omschrijving, Aantal, Te leveren, Gereserveerd, Eff. gereserveerd,
    // Vprijs, Korting, Bedrag, Leverdatum, actie.
    expect(cell).toHaveAttribute("colspan", "13");
    expect(screen.queryByText("5")).not.toBeInTheDocument();
    expect(screen.queryByText("k00", { exact: false })).not.toBeInTheDocument();
  });

  it("does not apply the title-line color to a normal article row", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.getByText(mockLijnen[0].artnr).className).not.toContain("text-primary-600");
    expect(screen.getByText(mockLijnen[0].omschrijving).className).not.toContain(
      "text-primary-600"
    );
  });

  it("shows the lijn-fout banner before the Lijnen heading when lijnFout=1 and sessionStorage has failures", async () => {
    stubFetch();
    searchParamsMock.mockReturnValue(new URLSearchParams("lijnFout=1"));
    sessionStorage.setItem(
      `luna:bon-lijn-fout:${mockBon.bonnr}`,
      JSON.stringify({ failed: [{ omschrijving: "Ontbrekende lijn", error: "400 Bad Request" }] })
    );

    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    expect(screen.getByText("Niet alle lijnen zijn opgeslagen.")).toBeInTheDocument();
    expect(screen.getByText("Ontbrekende lijn: 400 Bad Request")).toBeInTheDocument();
  });

  it("does not show the lijn-fout banner without lijnFout=1", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.queryByText("Niet alle lijnen zijn opgeslagen.")).not.toBeInTheDocument();
  });

  it("does not show editable header fields until 'Verbeteren' is clicked", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.queryByRole("textbox", { name: "Naam" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verbeteren" })).toBeInTheDocument();
  });

  it("switches to editable header fields after clicking 'Verbeteren', with bonnr/bedrag/btw staying read-only", async () => {
    stubFetch();
    const user = userEvent.setup();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    expect(screen.getByRole("textbox", { name: "Klant" })).toHaveValue("CONE LIGHTING BV");
    expect(screen.getByText("Bonnr")).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "Bedrag" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("keeps stempel and klnr read-only in edit mode (workflow-critical / identifier fields)", async () => {
    stubFetch();
    const user = userEvent.setup();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    // Stempel drives the backend's PUT-lijn stempel="D" guard and the
    // annuleer stempel="V"/"B" precondition - it must never be a free-text
    // input a user can type an arbitrary value into.
    expect(screen.queryByRole("textbox", { name: "Stempel" })).not.toBeInTheDocument();
    expect(screen.getByText("Stempel")).toBeInTheDocument();

    // Klnr is treated as an immutable identifier, consistent with offerte's
    // own klnr field.
    expect(screen.queryByRole("spinbutton", { name: "Klnr" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Klnr" })).not.toBeInTheDocument();
    expect(screen.getByText("Klnr")).toBeInTheDocument();
    expect(screen.getByText(String(mockBon.klnr))).toBeInTheDocument();
  });

  it("does not send stempel or klnr in the update payload", async () => {
    stubFetch();
    const user = userEvent.setup();
    updateBonMock.mockResolvedValue({ ...mockBon });

    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateBonMock).toHaveBeenCalledTimes(1));
    const [, payload] = updateBonMock.mock.calls[0];
    expect(payload).not.toHaveProperty("stempel");
    expect(payload).not.toHaveProperty("klnr");
  });

  it("saves the edited header fields and refreshes on success", async () => {
    stubFetch();
    const user = userEvent.setup();
    updateBonMock.mockResolvedValue({ ...mockBon, naam: "CONE LIGHTING NV" });

    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const naamInput = screen.getByRole("textbox", { name: "Klant" });
    await user.clear(naamInput);
    await user.type(naamInput, "CONE LIGHTING NV");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateBonMock).toHaveBeenCalledTimes(1));
    expect(updateBonMock).toHaveBeenCalledWith(
      1234567,
      expect.objectContaining({ naam: "CONE LIGHTING NV" })
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows an error and stays in edit mode when the update API call fails", async () => {
    stubFetch();
    const user = userEvent.setup();
    updateBonMock.mockRejectedValue(new Error("Bon 1234567 not found"));

    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Bon 1234567 not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("auto-enters edit mode when redirected here with ?edit=1 (offerte conversion flow)", async () => {
    stubFetch();
    searchParamsMock.mockReturnValue(new URLSearchParams("edit=1"));

    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    expect(screen.getByRole("textbox", { name: "Klant" })).toHaveValue("CONE LIGHTING BV");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("does not auto-enter edit mode without ?edit=1", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    expect(screen.queryByRole("textbox", { name: "Klant" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verbeteren" })).toBeInTheDocument();
  });

  describe("extra klantnummers / afleveradres / extra bedragen", () => {
    it("does not show 'Extra klantnummers' or 'Afleveradres' read-only sections when the data is empty", async () => {
      stubFetch();
      render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
      await flush();

      expect(screen.queryByText("Extra klantnummers")).not.toBeInTheDocument();
      expect(screen.queryByText("Afleveradres")).not.toBeInTheDocument();
      // Bedragen (extra) is always shown, even when zero.
      expect(screen.getByText("Bedragen (extra)")).toBeInTheDocument();
      expect(screen.getByText("Recupel bedrag")).toBeInTheDocument();
      expect(screen.getByText("A-bedrag")).toBeInTheDocument();
    });

    it("shows 'Extra klantnummers' and 'Afleveradres' read-only sections when the data is present", async () => {
      stubFetch();
      const bonWithExtras: BonItem = {
        ...mockBon,
        klnr2: 555,
        klnr3: 0,
        lnaam: "Aflever BV",
        lnaam1: "T.a.v. Jan",
        ladres: "Straat 1",
        lpostnr: "2000",
        lstad: "Antwerpen",
        recupelBedrag: 1.5,
        aBedrag: 2.5,
      };
      render(<BonDetailPage bon={bonWithExtras} lijnen={mockLijnen} />);
      await flush();

      expect(screen.getByText("Extra klantnummers")).toBeInTheDocument();
      expect(screen.getByText("Klnr2")).toBeInTheDocument();
      expect(screen.getByText("555")).toBeInTheDocument();
      // klnr3 is 0/falsy, so it should not render its own field.
      expect(screen.queryByText("Klnr3")).not.toBeInTheDocument();

      expect(screen.getByText("Afleveradres")).toBeInTheDocument();
      expect(screen.getByText("Aflever BV")).toBeInTheDocument();
      expect(screen.getByText("T.a.v. Jan")).toBeInTheDocument();
      expect(screen.getByText("Straat 1")).toBeInTheDocument();
      expect(screen.getByText("2000 Antwerpen")).toBeInTheDocument();
    });

    it("shows editable fields for extra klantnummers, afleveradres and extra bedragen in edit mode", async () => {
      stubFetch();
      const user = userEvent.setup();
      render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
      await flush();

      await user.click(screen.getByRole("button", { name: "Verbeteren" }));

      expect(screen.getByRole("spinbutton", { name: "Klnr2" })).toHaveValue(0);
      expect(screen.getByRole("spinbutton", { name: "Klnr3" })).toHaveValue(0);
      expect(screen.getByRole("textbox", { name: "Naam" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Naam 1" })).toHaveValue("");
      // "Adres"/"Postnr"/"Stad" labels are shared between the main
      // afzenderadres and the afleveradres sections - assert there are
      // exactly two of each (one per section) rather than picking by name.
      expect(screen.getAllByRole("textbox", { name: "Adres" })).toHaveLength(2);
      expect(screen.getAllByRole("textbox", { name: "Postnr" })).toHaveLength(2);
      expect(screen.getAllByRole("textbox", { name: "Stad" })).toHaveLength(2);
      expect(screen.getByRole("spinbutton", { name: "Recupel bedrag" })).toHaveValue(0);
      expect(screen.getByRole("spinbutton", { name: "A-bedrag" })).toHaveValue(0);
    });

    it("shows an aggregate numeric validation error and does not call the API when klnr2 is not a number", async () => {
      stubFetch();
      const user = userEvent.setup();
      render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
      await flush();

      await user.click(screen.getByRole("button", { name: "Verbeteren" }));

      // Native <input type="number"> silently refuses to hold a
      // non-numeric string (both via userEvent keystrokes and via
      // fireEvent.change), so a truly invalid value can only be forced
      // onto the underlying DOM node by temporarily flipping it to
      // type="text" before dispatching the change - this still exercises
      // the same controlled React onChange -> Number.isNaN validation
      // path.
      const klnr2Input = screen.getByRole("spinbutton", { name: "Klnr2" });
      klnr2Input.setAttribute("type", "text");
      fireEvent.change(klnr2Input, { target: { value: "not-a-number" } });

      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(
        await screen.findByText(
          "Alle numerieke velden (Klnr2, Klnr3, Recupel bedrag, A-bedrag) moeten geldige getallen zijn."
        )
      ).toBeInTheDocument();
      expect(updateBonMock).not.toHaveBeenCalled();
    });

    it("saves the extra klantnummers/afleveradres/bedragen fields with correct numeric coercion", async () => {
      stubFetch();
      const user = userEvent.setup();
      updateBonMock.mockResolvedValue({ ...mockBon, klnr2: 42, lnaam: "Aflever BV" });

      render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
      await flush();

      await user.click(screen.getByRole("button", { name: "Verbeteren" }));

      const klnr2Input = screen.getByRole("spinbutton", { name: "Klnr2" });
      await user.clear(klnr2Input);
      await user.type(klnr2Input, "42");

      const lnaamInput = screen.getByRole("textbox", { name: "Naam" });
      await user.type(lnaamInput, "Aflever BV");

      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(updateBonMock).toHaveBeenCalledTimes(1));
      expect(updateBonMock).toHaveBeenCalledWith(
        1234567,
        expect.objectContaining({
          klnr2: 42,
          klnr3: 0,
          recupelBedrag: 0,
          aBedrag: 0,
          lnaam: "Aflever BV",
          lnaam1: "",
          ladres: "",
          lpostnr: "",
          lstad: "",
        })
      );
    });
  });
});
