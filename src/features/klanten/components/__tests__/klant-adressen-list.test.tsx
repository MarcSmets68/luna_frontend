import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KlantAdressenList } from "../klant-adressen-list";
import type { KlantAdresItem } from "@/lib/api-client";

const mockItems: KlantAdresItem[] = [
  {
    klnr: 14644,
    lijnnr: 1,
    naam: "CONE LIGHTING BV",
    naam1: "Magazijn",
    adres: "Catershoflaan 70-76",
    postnr: "2170",
    stad: "Merksem",
    standaard: true,
  },
];

describe("KlantAdressenList", () => {
  it("renders the section heading", () => {
    render(<KlantAdressenList items={mockItems} />);
    expect(screen.getByRole("heading", { name: "Adressen" })).toBeInTheDocument();
  });

  it("renders every item's naam and standaard column", () => {
    render(<KlantAdressenList items={mockItems} />);
    expect(screen.getByText("CONE LIGHTING BV")).toBeInTheDocument();
    expect(screen.getByText("Magazijn")).toBeInTheDocument();
    expect(screen.getByText("Ja")).toBeInTheDocument();
  });

  it("shows an empty state when there are no items", () => {
    render(<KlantAdressenList items={[]} />);
    expect(screen.getByText("Geen adressen gevonden voor deze klant.")).toBeInTheDocument();
  });
});

