import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "../dashboard-page";
import { statCards, recentActivity, productionThisWeek } from "../../data/mock";

describe("DashboardPage", () => {
  it("renders the dashboard heading", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("renders every stat card label and value", () => {
    render(<DashboardPage />);
    for (const stat of statCards) {
      expect(screen.getByText(stat.label)).toBeInTheDocument();
      expect(screen.getByText(stat.value)).toBeInTheDocument();
    }
  });

  it("renders recent activity entries", () => {
    render(<DashboardPage />);
    for (const item of recentActivity) {
      expect(screen.getByText(item.text)).toBeInTheDocument();
    }
  });

  it("renders production orders for this week", () => {
    render(<DashboardPage />);
    for (const order of productionThisWeek) {
      expect(screen.getByText(order.id)).toBeInTheDocument();
      expect(screen.getByText(order.customer)).toBeInTheDocument();
    }
  });
});
