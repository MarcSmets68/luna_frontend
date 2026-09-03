import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VerkoopFurPage } from "../verkoop-fur-page";
import type { VerkoopFurItem } from "@/lib/api-client";

const mockItems: VerkoopFurItem[] = [
  {
    klnr: 14644,
    naam: "CONE LIGHTING BV",
    aantalFurOrders: 3,
    totaalAantalStuks: 42,
    laatsteBesteldatum: "2026-07-15",
  },
  {
    klnr: 10165,
    naam: "STUDIO ARTLIGHT BV",
    aantalFurOrders: 1,
    totaalAantalStuks: 6,
    laatsteBesteldatum: "2026-03-02",
  },
];

describe("VerkoopFurPage", () => {
  it("renders the period info line", () => {
    render(
      <VerkoopFurPage items={mockItems} periodeVan="2025-08-20" periodeTot="2026-08-20" />
    );

    expect(screen.getByText(/Periode:/)).toBeInTheDocument();
    expect(screen.getByText(/20\/08\/2025/)).toBeInTheDocument();
    expect(screen.getByText(/20\/08\/2026/)).toBeInTheDocument();
  });

  it("renders a row per dealer with the correct columns", () => {
    render(
      <VerkoopFurPage items={mockItems} periodeVan="2025-08-20" periodeTot="2026-08-20" />
    );

    expect(screen.getByText("14644")).toBeInTheDocument();
    expect(screen.getByText("CONE LIGHTING BV")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("15/07/2026")).toBeInTheDocument();

    expect(screen.getByText("10165")).toBeInTheDocument();
    expect(screen.getByText("STUDIO ARTLIGHT BV")).toBeInTheDocument();
  });

  it("renders the empty-state message when there are no items", () => {
    render(<VerkoopFurPage items={[]} periodeVan="2025-08-20" periodeTot="2026-08-20" />);

    expect(screen.getByText("Geen dealers gevonden in deze periode")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
