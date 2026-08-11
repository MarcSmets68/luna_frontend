import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  it("navigates to the klant detail page when Enter is pressed on a focused row", () => {
    pushMock.mockClear();
    render(<KlantenPage items={mockItems} page={1} hasMore={false} />);
    const row = screen.getByRole("link", { name: /open klant testklant/i });
    row.focus();
    row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(pushMock).toHaveBeenCalledWith("/klanten/1");
  });
});
