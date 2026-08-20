import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeveranciersPage } from "../leveranciers-page";
import type { LeverancierItem } from "@/lib/api-client";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const deleteLeverancierMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    deleteLeverancier: (...args: unknown[]) => deleteLeverancierMock(...args),
  };
});

const mockItems: LeverancierItem[] = [
  {
    levnr: 1,
    naam: "Testleverancier",
    naam1: "",
    contact: "Jan Janssens",
    adres: "Teststraat 1",
    postnr: "2400",
    stad: "Mol",
    land: "BE",
    tel: "014 12 34 56",
    fax: "",
    email: "jan@testleverancier.be",
    taal: "N",
    munt: "EUR",
    btwNr: "BE0123456789",
    saldo: 123.45,
    opm: "",
    type: false,
    controle: false,
    minBestel: 0,
  },
];

describe("LeveranciersPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    deleteLeverancierMock.mockReset();
  });

  it("renders the page heading", () => {
    render(<LeveranciersPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Leveranciers" })).toBeInTheDocument();
  });

  it("renders every item's levnr and naam", () => {
    render(<LeveranciersPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.levnr))).toBeInTheDocument();
      expect(screen.getByText(item.naam)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<LeveranciersPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen leveranciers gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<LeveranciersPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
      "href",
      "/leveranciers?page=2"
    );
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<LeveranciersPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
      "href",
      "/leveranciers?page=1"
    );
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });

  it("navigates to the leverancier detail page when a row is clicked", () => {
    render(<LeveranciersPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open leverancier testleverancier/i });
    row.click();
    expect(pushMock).toHaveBeenCalledWith("/leveranciers/1");
  });

  it("navigates to the create page when 'Nieuwe leverancier' is clicked", async () => {
    const user = userEvent.setup();
    render(<LeveranciersPage items={mockItems} page={1} hasMore={false} />);
    await user.click(screen.getByRole("button", { name: "Nieuwe leverancier" }));
    expect(pushMock).toHaveBeenCalledWith("/leveranciers/nieuw");
  });

  it("opens the delete dialog for a row without navigating", async () => {
    const user = userEvent.setup();
    render(<LeveranciersPage items={mockItems} page={1} hasMore={false} />);
    await user.click(screen.getByRole("button", { name: /verwijder leverancier testleverancier/i }));
    expect(pushMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Leverancier Testleverancier \(1\) verwijderen\?/)
    ).toBeInTheDocument();
  });

  describe("naam filter", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders the naam search input", () => {
      render(<LeveranciersPage items={mockItems} page={1} hasMore={false} />);
      expect(screen.getByPlaceholderText(/zoek op naam/i)).toBeInTheDocument();
    });

    it("debounces typing in the naam filter before navigating and resets to page 1", () => {
      render(<LeveranciersPage items={mockItems} page={3} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText(/zoek op naam/i), {
        target: { value: "Testleverancier" },
      });
      expect(pushMock).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(pushMock).toHaveBeenCalledWith("/leveranciers?page=1&naam=Testleverancier");
    });

    it("does not navigate before the full 400ms debounce window has elapsed", () => {
      render(<LeveranciersPage items={mockItems} page={1} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText(/zoek op naam/i), {
        target: { value: "Testleverancier" },
      });

      act(() => {
        vi.advanceTimersByTime(399);
      });
      expect(pushMock).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(pushMock).toHaveBeenCalledTimes(1);
    });

    it("preserves the current naam filter when navigating between pages", () => {
      render(<LeveranciersPage items={mockItems} page={2} hasMore={true} naam="Test" />);

      expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
        "href",
        "/leveranciers?page=1&naam=Test"
      );
      expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
        "href",
        "/leveranciers?page=3&naam=Test"
      );
    });
  });
});
