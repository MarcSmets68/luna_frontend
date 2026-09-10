import { act } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BonDetailPage } from "../bon-detail-page";
import type { BonItem, BonLijnItem } from "@/lib/api-client";
import { formatBedrag } from "@/lib/format";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const updateBonMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateBon: (...args: unknown[]) => updateBonMock(...args),
  };
});

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

describe("BonDetailPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    updateBonMock.mockReset();
  });

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

  it("hides Extra klantnummers when klnr2 and klnr3 are both zero", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.queryByText("Extra klantnummers")).not.toBeInTheDocument();
  });

  it("shows Extra klantnummers with only the non-zero field when one of klnr2/klnr3 is set", async () => {
    stubFetch();
    render(<BonDetailPage bon={{ ...mockBon, klnr2: 999 }} lijnen={mockLijnen} />);
    await flush();
    expect(screen.getByText("Extra klantnummers")).toBeInTheDocument();
    expect(screen.getByText("Klnr2")).toBeInTheDocument();
    expect(screen.getByText("999")).toBeInTheDocument();
    expect(screen.queryByText("Klnr3")).not.toBeInTheDocument();
  });

  it("hides Afleveradres when all afleveradres fields are empty", async () => {
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();
    expect(screen.queryByText("Afleveradres")).not.toBeInTheDocument();
  });

  it("shows Afleveradres with postnr+stad combined on one line when set", async () => {
    stubFetch();
    render(
      <BonDetailPage
        bon={{
          ...mockBon,
          lnaam: "Aflever BV",
          lpostnr: "9000",
          lstad: "Gent",
        }}
        lijnen={mockLijnen}
      />
    );
    await flush();
    expect(screen.getByText("Afleveradres")).toBeInTheDocument();
    expect(screen.getByText("Aflever BV")).toBeInTheDocument();
    expect(screen.getByText("9000 Gent")).toBeInTheDocument();
  });

  it("always shows Bedragen (extra) with formatted amounts", async () => {
    stubFetch();
    render(
      <BonDetailPage
        bon={{ ...mockBon, recupelBedrag: 12.5, aBedrag: 3.4 }}
        lijnen={mockLijnen}
      />
    );
    await flush();
    expect(screen.getByText("Bedragen (extra)")).toBeInTheDocument();
    expect(screen.getByText(formatBedrag(12.5))).toBeInTheDocument();
    expect(screen.getByText(formatBedrag(3.4))).toBeInTheDocument();
  });

  it("opens the edit dialog when 'Bewerken' is clicked", async () => {
    const user = userEvent.setup();
    stubFetch();
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Bewerken" }));

    expect(screen.getByRole("heading", { name: "Ordergegevens bewerken" })).toBeInTheDocument();
  });

  it("saves via the edit dialog and updates the displayed values without a page reload", async () => {
    const user = userEvent.setup();
    stubFetch();
    const updatedBon: BonItem = {
      ...mockBon,
      klnr2: 42,
      recupelBedrag: 7.5,
    };
    updateBonMock.mockResolvedValue(updatedBon);

    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    await flush();

    await user.click(screen.getByRole("button", { name: "Bewerken" }));
    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    await waitFor(() => expect(updateBonMock).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Extra klantnummers")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(formatBedrag(7.5))).toBeInTheDocument();
  });
});
