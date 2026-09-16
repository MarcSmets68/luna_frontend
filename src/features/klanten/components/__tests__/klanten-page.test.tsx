import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KlantenPage } from "../klanten-page";
import type { KlantItem } from "@/lib/api-client";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockItems: KlantItem[] = [
  {
    klnr: 1,
    naam: "Testklant",
    naam1: "",
    contact: "Jan Janssens",
    adres: "Teststraat 1",
    postnr: "2400",
    stad: "Mol",
    land: "BE",
    tel: "014 12 34 56",
    fax: "",
    gsm: "0495 12 34 56",
    email: "jan@testklant.be",
    taal: "N",
    munt: "EUR",
    btwNr: "BE0123456789",
    saldo: 123.45,
    geblokkeerd: false,
    opm: "",
  },
];

describe("KlantenPage", () => {
  it("renders the page heading", () => {
    render(<KlantenPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Klanten" })).toBeInTheDocument();
  });

  it("renders every item's klnr and naam", () => {
    render(<KlantenPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.klnr))).toBeInTheDocument();
      expect(screen.getByText(item.naam)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<KlantenPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen klanten gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<KlantenPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/klanten?page=2");
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<KlantenPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/klanten?page=1");
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });

  it("navigates to the klant detail page when a row is clicked", () => {
    pushMock.mockClear();
    render(<KlantenPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open klant testklant/i });
    row.click();
    expect(pushMock).toHaveBeenCalledWith("/klanten/1");
  });

  it("navigates to the create page when 'Nieuwe klant' is clicked", () => {
    pushMock.mockClear();
    render(<KlantenPage items={mockItems} page={1} hasMore={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Nieuwe klant" }));
    expect(pushMock).toHaveBeenCalledWith("/klanten/nieuw");
  });

  it("navigates to the klant detail page when Enter is pressed on a focused row", () => {
    pushMock.mockClear();
    render(<KlantenPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open klant testklant/i });
    row.focus();
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(pushMock).toHaveBeenCalledWith("/klanten/1");
  });

  describe("naam filter", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders the naam search input", () => {
      render(<KlantenPage items={mockItems} page={1} hasMore={false} />);
      expect(screen.getByPlaceholderText(/zoek op naam/i)).toBeInTheDocument();
    });

    it("debounces typing in the naam filter before navigating and resets to page 1", () => {
      pushMock.mockClear();
      render(<KlantenPage items={mockItems} page={3} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText(/zoek op naam/i), { target: { value: "Testklant" } });
      expect(pushMock).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(pushMock).toHaveBeenCalledWith("/klanten?page=1&naam=Testklant");
    });

    it("preserves the current naam filter when navigating between pages", () => {
      render(<KlantenPage items={mockItems} page={2} hasMore={true} naam="Test" />);

      expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/klanten?page=1&naam=Test");
      expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/klanten?page=3&naam=Test");
    });
  });

  describe("nomaled-dealers toggle", () => {
    it("renders both filter buttons", () => {
      render(<KlantenPage items={mockItems} page={1} hasMore={false} />);
      expect(screen.getByRole("button", { name: "Alle klanten" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Nomaled-dealers" })).toBeInTheDocument();
    });

    it("navigates with nomaled=true and resets to page 1 when 'Nomaled-dealers' is clicked", () => {
      pushMock.mockClear();
      render(<KlantenPage items={mockItems} page={3} hasMore={false} naam="Test" nomaled={false} />);

      fireEvent.click(screen.getByRole("button", { name: "Nomaled-dealers" }));
      expect(pushMock).toHaveBeenCalledWith("/klanten?page=1&naam=Test&nomaled=true");
    });

    it("is a no-op when clicking 'Alle klanten' while already on 'Alle klanten'", () => {
      pushMock.mockClear();
      render(<KlantenPage items={mockItems} page={1} hasMore={false} nomaled={false} />);

      fireEvent.click(screen.getByRole("button", { name: "Alle klanten" }));
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("navigates back to 'Alle klanten' (no nomaled param) and resets to page 1", () => {
      pushMock.mockClear();
      render(<KlantenPage items={mockItems} page={2} hasMore={false} nomaled={true} />);

      fireEvent.click(screen.getByRole("button", { name: "Alle klanten" }));
      expect(pushMock).toHaveBeenCalledWith("/klanten?page=1");
    });

    it("marks 'Nomaled-dealers' as the active button when nomaled is true", () => {
      render(<KlantenPage items={mockItems} page={1} hasMore={false} nomaled={true} />);
      expect(screen.getByRole("button", { name: "Nomaled-dealers" })).toHaveClass("bg-primary");
      expect(screen.getByRole("button", { name: "Alle klanten" })).not.toHaveClass("bg-primary");
    });

    it("marks 'Alle klanten' as the active button when nomaled is false (default)", () => {
      render(<KlantenPage items={mockItems} page={1} hasMore={false} />);
      expect(screen.getByRole("button", { name: "Alle klanten" })).toHaveClass("bg-primary");
      expect(screen.getByRole("button", { name: "Nomaled-dealers" })).not.toHaveClass("bg-primary");
    });

    it("preserves nomaled=true when paginating", () => {
      render(<KlantenPage items={mockItems} page={2} hasMore={true} nomaled={true} />);
      expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/klanten?page=1&nomaled=true");
      expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/klanten?page=3&nomaled=true");
    });

    describe("interaction with pending naam debounce", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("does not revert the toggle when a pending naam-debounce fires after the toggle click", () => {
        pushMock.mockClear();
        render(<KlantenPage items={mockItems} page={1} hasMore={false} nomaled={false} />);

        // Start typing - schedules a debounced push closing over nomaled=false.
        fireEvent.change(screen.getByPlaceholderText(/zoek op naam/i), { target: { value: "Testklant" } });
        expect(pushMock).not.toHaveBeenCalled();

        // Before the debounce fires, click the toggle - should push immediately with nomaled=true.
        fireEvent.click(screen.getByRole("button", { name: "Nomaled-dealers" }));
        expect(pushMock).toHaveBeenCalledWith("/klanten?page=1&naam=Testklant&nomaled=true");

        pushMock.mockClear();

        // Advance past the debounce window - the stale naam-debounce push must NOT fire
        // and revert the toggle back to nomaled=false.
        act(() => {
          vi.advanceTimersByTime(400);
        });
        expect(pushMock).not.toHaveBeenCalled();
      });
    });
  });
});
