import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCards } from "../stat-cards";
import type { DashboardStatCards } from "@/lib/api-client";

const statCards: DashboardStatCards = {
  openOffertesCount: 12,
  openOffertesBedragPotentieel: 48200,
  ordersInProductieCount: 9,
  ordersInProductieLeverenDezeWeek: 2,
  omzetDezeMaand: 86400,
  omzetVsVorigeMaandPct: 14,
  lageVoorraadCount: 3,
};

describe("StatCards", () => {
  it("wraps the 'Lage voorraad' card in a link to the filtered voorraadlijst", () => {
    render(<StatCards statCards={statCards} />);
    const link = screen.getByRole("link", { name: /lage voorraad/i });
    expect(link).toHaveAttribute("href", "/voorraad?lageVoorraad=true");
  });

  it("links quote/order KPIs to explicitly labeled overviews without inventing backend filters", () => {
    render(<StatCards statCards={statCards} />);
    expect(screen.getByRole("link", { name: /open offertes: alle offertes bekijken/i })).toHaveAttribute("href", "/offertes/alle");
    expect(screen.getByRole("link", { name: /orders in productie: alle orders bekijken/i })).toHaveAttribute("href", "/orders/alle");
    expect(screen.queryByRole("link", { name: /omzet deze maand/i })).not.toBeInTheDocument();
  });
});
