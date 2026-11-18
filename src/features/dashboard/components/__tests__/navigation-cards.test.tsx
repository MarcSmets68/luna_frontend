import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductionCard } from "../production-card";
import { RecentActivityCard } from "../recent-activity-card";

describe("dashboard navigation", () => {
  it("opens the actual order from a production row", () => {
    render(<ProductionCard items={[{ bonnr: 123, klant: "Atelier", leverdatum: null, bedrag: 10, geparkeerd: false }]} />);
    expect(screen.getByRole("link", { name: "Open order 123 voor Atelier" })).toHaveAttribute("href", "/orders/123");
  });

  it("uses activity-type overviews when the API does not supply record IDs", () => {
    render(<RecentActivityCard items={[{ type: "offerte", text: "Nieuwe offerte", datum: null }, { type: "bon", text: "Order gewijzigd", datum: null }, { type: "factuur", text: "Factuur gemaakt", datum: null }]} />);
    expect(screen.getByRole("link", { name: /Nieuwe offerte: bekijk alle offertes/ })).toHaveAttribute("href", "/offertes/alle");
    expect(screen.getByRole("link", { name: /Order gewijzigd: bekijk alle orders/ })).toHaveAttribute("href", "/orders/alle");
    expect(screen.getByRole("link", { name: /Factuur gemaakt: bekijk alle facturen/ })).toHaveAttribute("href", "/facturatie/alle");
  });
});
