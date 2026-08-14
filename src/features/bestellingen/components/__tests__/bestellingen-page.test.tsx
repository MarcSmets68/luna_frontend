import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BestellingenPage } from "../bestellingen-page";
import type { BestelorderItem } from "@/lib/api-client";

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

  it("renders every item's ordnr and naam", () => {
    render(<BestellingenPage items={mockItems} page={1} hasMore={false} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.ordnr))).toBeInTheDocument();
      expect(screen.getByText(item.naam)).toBeInTheDocument();
    }
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
});
