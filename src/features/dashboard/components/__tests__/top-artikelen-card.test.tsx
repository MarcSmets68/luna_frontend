import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TopArtikelenCard } from "../top-artikelen-card";
import type { DashboardTopArtikelItem } from "@/lib/api-client";

const items: DashboardTopArtikelItem[] = [
  { rang: 1, artnr: "NOMALED.LS24.3000", omschrijving: "Ledstrip 24V 3000K", omzet: 7312.4, aantal: 1250, aandeelPct: 8.5, omzetVorigeMaand: 8100, vsVorigeMaandPct: -9.7 },
  { rang: 2, artnr: "DRV.100", omschrijving: "Driver 100W", omzet: 2000, aantal: 40, aandeelPct: 2.3, omzetVorigeMaand: 0, vsVorigeMaandPct: null },
];

describe("TopArtikelenCard", () => {
  it("renders rows with omschrijving, artnr, amount, share, quantity and badges", () => {
    render(<TopArtikelenCard items={items} error={false} />);
    expect(screen.getByText("Top 5 artikelen")).toBeInTheDocument();
    expect(screen.getByText("Ledstrip 24V 3000K")).toBeInTheDocument();
    expect(screen.getByText("NOMALED.LS24.3000")).toBeInTheDocument();
    expect(screen.getByText("€ 7.312,40")).toBeInTheDocument();
    expect(screen.getByText(/8,5% ·\s+1\.250 stuks/)).toBeInTheDocument();
    const badges = screen.getAllByTestId("vs-vorige-maand");
    expect(badges[0]).toHaveTextContent("↓ 9,7% vs vorige maand");
    expect(badges[1]).toHaveTextContent("geen data vorige maand");
  });

  it("renders empty state", () => {
    render(<TopArtikelenCard items={[]} error={false} />);
    expect(screen.getByText("Nog geen facturen deze maand.")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(<TopArtikelenCard items={[]} error />);
    expect(screen.getByText("Top 5 artikelen")).toBeInTheDocument();
    expect(screen.getByText("Kon top artikelen niet laden.")).toBeInTheDocument();
  });
});
