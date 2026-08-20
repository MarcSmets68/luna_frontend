import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrdersPage } from "../orders-page";
import type { BonItem } from "@/lib/api-client";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockItems: BonItem[] = [
  {
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
  },
];

describe("OrdersPage", () => {
  it("renders the page heading", () => {
    render(<OrdersPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Alle orders" })).toBeInTheDocument();
  });

  it("renders every item's bonnr and naam", () => {
    render(<OrdersPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.bonnr))).toBeInTheDocument();
      expect(screen.getByText(item.naam)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<OrdersPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen orders gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<OrdersPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/orders/alle?page=2");
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<OrdersPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/orders/alle?page=1");
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });

  describe("filters", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders the Bonnr and Klant filter inputs", () => {
      render(<OrdersPage items={mockItems} page={1} hasMore={false} />);
      expect(screen.getByPlaceholderText("Bonnr.")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Klant")).toBeInTheDocument();
    });

    it("debounces typing in the Bonnr filter before navigating and resets to page 1", () => {
      pushMock.mockClear();
      render(<OrdersPage items={mockItems} page={3} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText("Bonnr."), { target: { value: "1234" } });
      expect(pushMock).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(pushMock).toHaveBeenCalledWith("/orders/alle?page=1&bonnr=1234");
    });

    it("debounces typing in the Klant filter before navigating and resets to page 1", () => {
      pushMock.mockClear();
      render(<OrdersPage items={mockItems} page={2} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText("Klant"), { target: { value: "Cone" } });
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(pushMock).toHaveBeenCalledWith("/orders/alle?page=1&naam=Cone");
    });

    it("preserves the current filters when navigating between pages", () => {
      render(<OrdersPage items={mockItems} page={2} hasMore={true} bonnr="123" naam="Cone" />);

      expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
        "href",
        "/orders/alle?page=1&bonnr=123&naam=Cone"
      );
      expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
        "href",
        "/orders/alle?page=3&bonnr=123&naam=Cone"
      );
    });
  });

  it("navigates to the bon detail page when a row is clicked", () => {
    pushMock.mockClear();
    render(<OrdersPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open bon 1234567/i });
    row.click();
    expect(pushMock).toHaveBeenCalledWith("/orders/1234567");
  });

  it("navigates to the bon detail page when Enter is pressed on a focused row", () => {
    pushMock.mockClear();
    render(<OrdersPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open bon 1234567/i });
    row.focus();
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(pushMock).toHaveBeenCalledWith("/orders/1234567");
  });
});
