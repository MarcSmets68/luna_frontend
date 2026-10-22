import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TopKlantenCard } from "../top-klanten-card";
import type { DashboardTopKlantItem } from "@/lib/api-client";

const items: DashboardTopKlantItem[] = [
  { rang: 1, klnr: 1, naam: "Leds and Light", omzet: 18450.25, aantalFacturen: 6, aandeelPct: 21.4, omzetVorigeMaand: 15200, vsVorigeMaandPct: 21.4 },
  { rang: 2, klnr: 2, naam: "CONE LIGHTING BV", omzet: 9120, aantalFacturen: 3, aandeelPct: 10.6, omzetVorigeMaand: 0, vsVorigeMaandPct: null },
  { rang: 3, klnr: 3, naam: "Gypel bvba", omzet: 500, aantalFacturen: 1, aandeelPct: 0.6, omzetVorigeMaand: 800, vsVorigeMaandPct: -37.5 },
];

describe("TopKlantenCard", () => {
  it("renders rows with name, amount, share, invoices and badges", () => {
    render(<TopKlantenCard items={items} error={false} />);
    expect(screen.getByText("Top 5 klanten")).toBeInTheDocument();
    expect(screen.getByText("netto excl. BTW, deze maand tot nu toe")).toBeInTheDocument();
    expect(screen.getByText("Leds and Light")).toBeInTheDocument();
    expect(screen.getByText("€ 18.450,25")).toBeInTheDocument();
    expect(screen.getByText(/21,4% · 6 facturen/)).toBeInTheDocument();
    const badges = screen.getAllByTestId("vs-vorige-maand");
    expect(badges[0]).toHaveTextContent("↑ 21,4% vs vorige maand");
    expect(badges[1]).toHaveTextContent("geen data vorige maand");
    expect(badges[2]).toHaveTextContent("↓ 37,5% vs vorige maand");
  });

  it("renders empty state", () => {
    render(<TopKlantenCard items={[]} error={false} />);
    expect(screen.getByText("Nog geen facturen deze maand.")).toBeInTheDocument();
  });

  it("renders error state with card chrome", () => {
    render(<TopKlantenCard items={[]} error />);
    expect(screen.getByText("Top 5 klanten")).toBeInTheDocument();
    expect(screen.getByText("Kon top klanten niet laden.")).toBeInTheDocument();
    expect(screen.queryByText("Nog geen facturen deze maand.")).not.toBeInTheDocument();
  });
});
