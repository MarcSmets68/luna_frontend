import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaatsingenPage } from "../plaatsingen-page";
import type { PlaatsingItem } from "../../types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockItems: PlaatsingItem[] = [
  {
    planr: 24001,
    datum: "2026-03-04",
    klnr: 10423,
    klantNaam: "Interieur Van Damme bvba",
    vrtgw: "JVH",
    vrtgwNaam: "Jan Van Herck",
    project: 1042,
    bonnr: 219034,
    factuur: true,
    datumAfsluiting: "2026-04-18",
    naam: "Interieur Van Damme bvba",
    naam1: "",
    adres: "Steenweg op Gent 112",
    postnr: "9300",
    stad: "Aalst",
    land: "BE",
    lnaam: "Showroom Van Damme",
    lnaam1: "",
    ladres: "Nijverheidslaan 8",
    lpostnr: "9300",
    lstad: "Aalst",
    telefoon: "053/12.34.56",
    gsm: "0475/11.22.33",
    gsm2: "",
    email: "info@vandamme-interieur.be",
    email2: "",
    plaatsingswijze: "Aan uurloon",
    plaatsingsdatum: "2026-04-15",
    prijs: 480,
    locatie: "MAG1",
    swVoorbereiding: true,
    voorbereiding: "",
    swOpvolging: false,
    opvolging: "",
    opm: "",
    facturatie: "",
    klassementmap: "",
    werkbonmap: "",
  },
];

describe("PlaatsingenPage", () => {
  it("renders the page heading", () => {
    render(<PlaatsingenPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Plaatsingen" })).toBeInTheDocument();
  });

  it("renders every item's planr, klant and status", () => {
    render(<PlaatsingenPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.planr))).toBeInTheDocument();
      expect(screen.getByText(item.klantNaam)).toBeInTheDocument();
    }
    expect(screen.getByText("Afgesloten")).toBeInTheDocument();
  });

  it("shows an empty state when there are no items", () => {
    render(<PlaatsingenPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen plaatsingen gevonden.")).toBeInTheDocument();
  });

  it("navigates to the plaatsing detail page when a row is clicked", () => {
    pushMock.mockClear();
    render(<PlaatsingenPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open plaatsing 24001/i });
    row.click();
    expect(pushMock).toHaveBeenCalledWith("/plaatsingen/24001");
  });

  describe("filters", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders the Planr and Klant filter inputs", () => {
      render(<PlaatsingenPage items={mockItems} page={1} hasMore={false} />);
      expect(screen.getByPlaceholderText("Planr.")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Klant")).toBeInTheDocument();
    });

    it("debounces typing in the Planr filter before navigating and resets to page 1", () => {
      pushMock.mockClear();
      render(<PlaatsingenPage items={mockItems} page={3} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText("Planr."), { target: { value: "2400" } });
      expect(pushMock).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(pushMock).toHaveBeenCalledWith("/plaatsingen?page=1&planr=2400");
    });

    it("preserves the current filters when navigating between pages", () => {
      render(
        <PlaatsingenPage items={mockItems} page={2} hasMore={true} planr="240" naam="Damme" />
      );

      expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
        "href",
        "/plaatsingen?page=1&planr=240&naam=Damme"
      );
      expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
        "href",
        "/plaatsingen?page=3&planr=240&naam=Damme"
      );
    });
  });
});
