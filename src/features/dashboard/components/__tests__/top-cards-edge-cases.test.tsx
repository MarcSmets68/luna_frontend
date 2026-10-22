import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TopKlantenCard } from "../top-klanten-card";
import { TopArtikelenCard } from "../top-artikelen-card";
import { VsVorigeMaand } from "../vs-vorige-maand";
import type { DashboardTopArtikelItem, DashboardTopKlantItem } from "@/lib/api-client";

const klant: DashboardTopKlantItem = {
  rang: 1, klnr: 1, naam: "Leds and Light", omzet: 100, aantalFacturen: 1,
  aandeelPct: 5, omzetVorigeMaand: 50, vsVorigeMaandPct: 100,
};
const artikel: DashboardTopArtikelItem = {
  rang: 1, artnr: "A.1", omschrijving: "Artikel een", omzet: 100, aantal: 2.5,
  aandeelPct: 5, omzetVorigeMaand: 50, vsVorigeMaandPct: 100,
};

describe("top cards edge cases", () => {
  it("klanten: error=true hides stale rows and empty message", () => {
    render(<TopKlantenCard items={[klant]} error />);
    expect(screen.getByText("Kon top klanten niet laden.")).toBeInTheDocument();
    expect(screen.queryByText("Leds and Light")).not.toBeInTheDocument();
    expect(screen.queryByText("Nog geen facturen deze maand.")).not.toBeInTheDocument();
  });

  it("artikelen: error=true hides rows and empty message", () => {
    render(<TopArtikelenCard items={[artikel]} error />);
    expect(screen.getByText("Kon top artikelen niet laden.")).toBeInTheDocument();
    expect(screen.queryByText("Artikel een")).not.toBeInTheDocument();
    expect(screen.queryByText("Nog geen facturen deze maand.")).not.toBeInTheDocument();
  });

  it("artikelen: decimal quantity uses nl-BE formatting", () => {
    render(<TopArtikelenCard items={[artikel]} error={false} />);
    expect(screen.getByText(/2,5 stuks/)).toBeInTheDocument();
  });

  it("renders a single row without crashing and renders max 5 rows as given", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ ...klant, rang: i + 1, klnr: i + 1, naam: `K${i + 1}` }));
    render(<TopKlantenCard items={five} error={false} />);
    expect(screen.getAllByTestId("vs-vorige-maand")).toHaveLength(5);
  });

  it("badge: 0% is neutral-positive (up arrow, 0%), not 'geen data'", () => {
    render(<VsVorigeMaand value={0} />);
    expect(screen.getByTestId("vs-vorige-maand")).toHaveTextContent("↑ 0% vs vorige maand");
  });

  it("badge: undefined (older backend row) falls back to 'geen data'", () => {
    render(<VsVorigeMaand value={undefined as unknown as null} />);
    expect(screen.getByText("geen data vorige maand")).toBeInTheDocument();
  });
});
