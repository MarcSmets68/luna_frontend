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
  omzetTrend: [
    { month: 9, year: 2025, label: "sep 2025", total: 41200.0, isPartial: false },
    { month: 10, year: 2025, label: "okt 2025", total: 48750.25, isPartial: false },
    { month: 11, year: 2025, label: "nov 2025", total: 39900.0, isPartial: false },
    { month: 12, year: 2025, label: "dec 2025", total: 55600.0, isPartial: false },
    { month: 1, year: 2026, label: "jan 2026", total: 43100.5, isPartial: false },
    { month: 2, year: 2026, label: "feb 2026", total: 47300.0, isPartial: false },
    { month: 3, year: 2026, label: "mrt 2026", total: 52100.0, isPartial: false },
    { month: 4, year: 2026, label: "apr 2026", total: 0.0, isPartial: false },
    { month: 5, year: 2026, label: "mei 2026", total: 37850.5, isPartial: false },
    { month: 6, year: 2026, label: "jun 2026", total: 61200.0, isPartial: false },
    { month: 7, year: 2026, label: "jul 2026", total: 49500.0, isPartial: false },
    { month: 8, year: 2026, label: "aug 2026", total: 86400.0, isPartial: true },
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

  it("renders the omzet trend card", () => {
    render(<DashboardPage dashboard={dashboard} />);
    expect(screen.getByText("Omzet 12 maanden")).toBeInTheDocument();
    for (const item of dashboard.omzetTrend) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });
});
