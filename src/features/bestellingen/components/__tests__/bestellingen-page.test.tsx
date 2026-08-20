import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BestellingenPage } from "../bestellingen-page";
import type { BestelorderItem } from "@/lib/api-client";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockItems: BestelorderItem[] = [
  {
    ordnr: 2169001,
    stempel: "V",
    datum: "2026-07-17",
    levnr: 655,
    naam: "Alcom electronics nv",
    stad: "Kontich",
    munt: "USD",
    bedrag: 205.7,
    levDatum: null,
    geparkeerd: false,
    uRef: "",
    opm: "",
  },
];

describe("BestellingenPage", () => {
  it("renders the page heading", () => {
    render(<BestellingenPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Bestellingen" })).toBeInTheDocument();
  });

  it("renders every item's ordnr, naam and status label", () => {
    render(<BestellingenPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.ordnr))).toBeInTheDocument();
      expect(screen.getByText(item.naam)).toBeInTheDocument();
    }
    expect(screen.getByText("Aktief")).toBeInTheDocument();
  });

  it("shows an empty state when there are no items", () => {
    render(<BestellingenPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen bestellingen gevonden.")).toBeInTheDocument();
  });

  it("shows a disabled 'Vorige' link on the first page and an enabled 'Volgende' link when there is more data", () => {
    render(<BestellingenPage items={mockItems} page={1} hasMore={true} />);
    expect(screen.queryByRole("link", { name: /vorige/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute("href", "/bestellingen?page=2");
  });

  it("shows an enabled 'Vorige' link on subsequent pages", () => {
    render(<BestellingenPage items={mockItems} page={2} hasMore={false} />);
    expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute("href", "/bestellingen?page=1");
    expect(screen.queryByRole("link", { name: /volgende/i })).not.toBeInTheDocument();
  });

  it("navigates to the bestelling detail page when a row is clicked", () => {
    pushMock.mockClear();
    render(<BestellingenPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open bestelling 2169001/i });
    row.click();
    expect(pushMock).toHaveBeenCalledWith("/bestellingen/2169001");
  });

  it("navigates to the bestelling detail page when Enter is pressed on a focused row", () => {
    pushMock.mockClear();
    render(<BestellingenPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open bestelling 2169001/i });
    row.focus();
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(pushMock).toHaveBeenCalledWith("/bestellingen/2169001");
  });

  describe("filters en sortering", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders the Ordernr and Leverancier filter inputs", () => {
      render(<BestellingenPage items={mockItems} page={1} hasMore={false} />);
      expect(screen.getByPlaceholderText("Ordernr.")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Leverancier")).toBeInTheDocument();
    });

    it("debounces typing in the Ordernr filter before navigating and resets to page 1", () => {
      pushMock.mockClear();
      render(<BestellingenPage items={mockItems} page={3} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText("Ordernr."), { target: { value: "2169" } });
      expect(pushMock).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(pushMock).toHaveBeenCalledWith("/bestellingen?page=1&ordnr=2169");
    });

    it("debounces typing in the Leverancier filter before navigating and resets to page 1", () => {
      pushMock.mockClear();
      render(<BestellingenPage items={mockItems} page={2} hasMore={false} />);

      fireEvent.change(screen.getByPlaceholderText("Leverancier"), { target: { value: "Alcom" } });
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(pushMock).toHaveBeenCalledWith("/bestellingen?page=1&naam=Alcom");
    });

    it("navigates with the current sortField/sortDir when changing sort", async () => {
      pushMock.mockClear();
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<BestellingenPage items={mockItems} page={1} hasMore={false} />);

      await user.click(screen.getByRole("combobox", { name: "Sorteren op" }));
      await user.click(await screen.findByRole("option", { name: "Leverancier" }));

      await new Promise((resolve) => setTimeout(resolve, 450));
      expect(pushMock).toHaveBeenCalledWith("/bestellingen?page=1&sortField=naam");
    }, 10000);

    it("preserves the current filters/sort when navigating between pages", () => {
      render(
        <BestellingenPage
          items={mockItems}
          page={2}
          hasMore={true}
          ordnr="216"
          naam="Alcom"
          sortField="datum"
          sortDir="asc"
        />
      );

      expect(screen.getByRole("link", { name: /vorige/i })).toHaveAttribute(
        "href",
        "/bestellingen?page=1&ordnr=216&naam=Alcom&sortField=datum&sortDir=asc"
      );
      expect(screen.getByRole("link", { name: /volgende/i })).toHaveAttribute(
        "href",
        "/bestellingen?page=3&ordnr=216&naam=Alcom&sortField=datum&sortDir=asc"
      );
    });
  });
});
