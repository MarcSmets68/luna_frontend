import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "../dashboard-page";
import type { DashboardResponse } from "@/lib/api-client";

const dashboard: DashboardResponse = {
  statCards: {
    openOffertesCount: 12,
    openOffertesBedragPotentieel: 48200,
    ordersInProductieCount: 9,
    ordersInProductieLeverenDezeWeek: 2,
    omzetDezeMaand: 86400,
    omzetVsVorigeMaandPct: 14,
    lageVoorraadCount: 3,
  },
  recentActivity: [
    { text: "Offerte 2167769 aangemaakt voor CONE LIGHTING BV", datum: "2026-08-07", type: "offerte" },
    { text: "Order 2177454 aangemaakt voor CONE LIGHTING BV", datum: "2026-08-07", type: "bon" },
    { text: "Factuur 2280100 aangemaakt voor Leds and Light", datum: "2026-07-17", type: "factuur" },
  ],
  productionThisWeek: [
    { bonnr: 2176927, klant: "Gypel bvba", leverdatum: "2026-08-10", bedrag: 1985.53, geparkeerd: false },
    { bonnr: 5000787, klant: "Meufalux bvba", leverdatum: "2026-08-10", bedrag: 530.32, geparkeerd: false },
  ],
};

describe("DashboardPage", () => {
  it("renders the dashboard heading", () => {
    render(<DashboardPage dashboard={dashboard} />);
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("renders every stat card label and value", () => {
    render(<DashboardPage dashboard={dashboard} />);
    expect(screen.getByText("Open offertes")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Omzet deze maand")).toBeInTheDocument();
    expect(screen.getByText("Lage voorraad")).toBeInTheDocument();
  });

  it("renders recent activity entries", () => {
    render(<DashboardPage dashboard={dashboard} />);
    for (const item of dashboard.recentActivity) {
      expect(screen.getByText(item.text)).toBeInTheDocument();
    }
  });

  it("renders production orders for this week", () => {
    render(<DashboardPage dashboard={dashboard} />);
    for (const order of dashboard.productionThisWeek) {
      expect(screen.getByText(String(order.bonnr))).toBeInTheDocument();
      expect(screen.getByText(order.klant)).toBeInTheDocument();
    }
  });
});
