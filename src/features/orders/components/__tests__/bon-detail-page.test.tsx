import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const searchParamsMock = vi.fn(() => new URLSearchParams());
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsMock(),
}));

beforeEach(() => {
  searchParamsMock.mockReset();
  searchParamsMock.mockReturnValue(new URLSearchParams());
  sessionStorage.clear();
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
    gereserv: 10,
    effectiefGereserv: 10,
    swEffectief: false,
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

  it("renders the Gereserveerd and Eff. gereserveerd headers between Te leveren and Vprijs", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    const headers = screen.getAllByRole("columnheader").map((el) => el.textContent);
    const teLeverenIndex = headers.indexOf("Te leveren");
    const vprijsIndex = headers.indexOf("Vprijs");
    expect(headers[teLeverenIndex + 1]).toBe("Gereserveerd");
    expect(headers[teLeverenIndex + 2]).toBe("Eff. gereserveerd");
    expect(vprijsIndex).toBe(teLeverenIndex + 3);
  });

  it("highlights the Gereserveerd cell when effectively reserved and under-reserved", () => {
    render(<BonDetailPage bon={mockBon} lijnen={[mockUnderReservedLijn]} />);
    const cell = screen.getByText("3");
    expect(cell.className).toContain("bg-amber-100");
  });

  it("does not highlight the Gereserveerd cell when the line is not under-reserved", () => {
    render(<BonDetailPage bon={mockBon} lijnen={[mockNotUnderReservedLijn]} />);
    const cell = screen.getByText("12");
    expect(cell.className).not.toContain("bg-amber-100");
  });

  it("renders zero and negative reservation values as plain numbers", () => {
    render(<BonDetailPage bon={mockBon} lijnen={[mockZeroNegativeLijn]} />);
    expect(screen.getByText("-1")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("collapses a K00 line to a single merged cell in the primary-600 title-line color", () => {
    render(<BonDetailPage bon={mockBon} lijnen={[mockTitleLijn]} />);
    const cell = screen.getByText("SECTIE TITEL");
    expect(cell.className).toContain("text-primary-600");
    expect(cell.tagName).toBe("TD");
    expect(cell).toHaveAttribute("colspan", "11");
    expect(screen.queryByText("5")).not.toBeInTheDocument();
    expect(screen.queryByText("k00", { exact: false })).not.toBeInTheDocument();
  });

  it("does not apply the title-line color to a normal article row", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.getByText(mockLijnen[0].artnr).className).not.toContain("text-primary-600");
    expect(screen.getByText(mockLijnen[0].omschrijving).className).not.toContain(
      "text-primary-600"
    );
  });

  it("shows the lijn-fout banner before the Lijnen heading when lijnFout=1 and sessionStorage has failures", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("lijnFout=1"));
    sessionStorage.setItem(
      `luna:bon-lijn-fout:${mockBon.bonnr}`,
      JSON.stringify({ failed: [{ omschrijving: "Ontbrekende lijn", error: "400 Bad Request" }] })
    );

    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);

    expect(screen.getByText("Niet alle lijnen zijn opgeslagen.")).toBeInTheDocument();
    expect(screen.getByText("Ontbrekende lijn: 400 Bad Request")).toBeInTheDocument();
  });

  it("does not show the lijn-fout banner without lijnFout=1", () => {
    render(<BonDetailPage bon={mockBon} lijnen={mockLijnen} />);
    expect(screen.queryByText("Niet alle lijnen zijn opgeslagen.")).not.toBeInTheDocument();
  });
});
