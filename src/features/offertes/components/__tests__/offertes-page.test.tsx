import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OffertesPage } from "../offertes-page";
import type { OfferteItem } from "@/lib/api-client";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockItems: OfferteItem[] = [
  {
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
    offgroep: "",
    soort: "DNOM",
    passief: false,
    verloren: false,
    verkocht: false,
    verkoopkans: 0,
    uRef: "Test met kleuren voor RAL setup kost",
    besteldatum: null,
    verkochtdatum: null,
    opm: "",
  },
];

describe("OffertesPage", () => {
  it("renders the page heading", () => {
    render(<OffertesPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Alle offertes" })).toBeInTheDocument();
  });

  it("renders every item's offnr and naam", () => {
    render(<OffertesPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.offnr))).toBeInTheDocument();
      expect(screen.getByText(item.naam)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<OffertesPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen offertes gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<OffertesPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/offertes/alle?page=2");
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<OffertesPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/offertes/alle?page=1");
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });

  describe("filters", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders the Offnr and Klant filter inputs with correct labels/values", () => {
      render(<OffertesPage items={mockItems} page={1} hasMore={false} offnr="216" naam="Cone" />);
      expect(screen.getByLabelText("Offnr")).toHaveValue("216");
      expect(screen.getByLabelText("Klant")).toHaveValue("Cone");
    });

    it("debounces typing in the Offnr filter before navigating and resets to page 1", () => {
      pushMock.mockClear();
      render(<OffertesPage items={mockItems} page={3} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText("Offnr."), { target: { value: "2167" } });
      expect(pushMock).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(pushMock).toHaveBeenCalledWith("/offertes/alle?page=1&offnr=2167");
    });

    it("debounces typing in the Klant filter before navigating and resets to page 1", () => {
      pushMock.mockClear();
      render(<OffertesPage items={mockItems} page={2} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText("Klant"), { target: { value: "Cone" } });
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(pushMock).toHaveBeenCalledWith("/offertes/alle?page=1&naam=Cone");
    });

    it("preserves the current filters when navigating between pages", () => {
      render(<OffertesPage items={mockItems} page={2} hasMore={true} offnr="216" naam="Cone" />);

      expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
        "href",
        "/offertes/alle?page=1&offnr=216&naam=Cone"
      );
      expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
        "href",
        "/offertes/alle?page=3&offnr=216&naam=Cone"
      );
    });
  });
});
