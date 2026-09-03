import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KlantKortingenList } from "../klant-kortingen-list";
import type { KlantKortingItem } from "@/lib/api-client";

const mockItems: KlantKortingItem[] = [
  { klnr: 14644, artnr: "ART-001", korting: 12.5, naam: "LED-spot 5W" },
];

describe("KlantKortingenList", () => {
  it("renders the section heading", () => {
    render(<KlantKortingenList items={mockItems} />);
    expect(screen.getByRole("heading", { name: "Kortingen" })).toBeInTheDocument();
  });

  it("renders every item's artnr, artikelnaam and korting as a percentage", () => {
    render(<KlantKortingenList items={mockItems} />);
    expect(screen.getByText("ART-001")).toBeInTheDocument();
    expect(screen.getByText("LED-spot 5W")).toBeInTheDocument();
    expect(screen.getByText("12.5%")).toBeInTheDocument();
  });

  it("shows an empty state when there are no items", () => {
    render(<KlantKortingenList items={[]} />);
    expect(screen.getByText("Geen kortingen gevonden voor deze klant.")).toBeInTheDocument();
  });
});

