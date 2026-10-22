import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProductieplanningPage } from "../productieplanning-page";
import type { PlanningEntry } from "../../lib/build-planning";

const TODAY = new Date(2026, 9, 22);

const entries: PlanningEntry[] = [
  {
    key: "led-1",
    afdeling: "led-montage",
    bonnr: 101,
    groepnr: 2,
    klant: "Acme",
    artnr: "LED1",
    omschrijving: "Ledstrip",
    aantal: 3,
    datum: "2026-10-23",
    kleur: null,
    status: null,
  },
  {
    key: "lak-1",
    afdeling: "lak",
    bonnr: 202,
    groepnr: null,
    klant: "Beta",
    artnr: "ALU1",
    omschrijving: "Profiel",
    aantal: 6,
    datum: "2026-10-01",
    kleur: "ANO · Brons",
    status: "Nog te bestellen",
  },
];

describe("ProductieplanningPage", () => {
  it("groups lines per week with links to the order", () => {
    render(<ProductieplanningPage entries={entries} today={TODAY} />);

    expect(screen.getByRole("heading", { name: "Planning" })).toBeInTheDocument();
    const overdue = screen.getByRole("region", { name: "Achterstallig" });
    expect(within(overdue).getByText("Beta")).toBeInTheDocument();
    expect(within(overdue).getByText("ANO · Brons")).toBeInTheDocument();

    const week = screen.getByRole("region", { name: "Deze week (week 43)" });
    expect(within(week).getByRole("link", { name: "101 / 2" })).toHaveAttribute("href", "/orders/101");
  });

  it("filters by afdeling", async () => {
    render(<ProductieplanningPage entries={entries} today={TODAY} />);

    await userEvent.click(screen.getByRole("button", { name: "Lak (1)" }));
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "LED-montage (1)" }));
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("shows per-afdeling load errors and an empty state", () => {
    render(
      <ProductieplanningPage
        entries={[]}
        errors={[{ afdeling: "lak", message: "Boem" }]}
        today={TODAY}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Lak kon niet geladen worden: Boem");
    expect(screen.getByText("Geen open productielijnen.")).toBeInTheDocument();
  });
});
