import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildDashboardModel } from "../../lib/dashboard-model";
import { computeHero } from "../../lib/dashboard-aggregations";
import { OmzetanalyseTabs } from "../omzetanalyse-tabs";
import { OmzetanalyseDashboard } from "../dashboard/omzetanalyse-dashboard";
import { DealersTable } from "../dashboard/dealers-table";
import { HeroKpis } from "../dashboard/hero-kpis";
import {
  jarenResponse,
  perDealerJarenResponse,
  perDealerPeriodeResponse,
} from "../../test-utils/fixtures";

const pd = buildDashboardModel(perDealerJarenResponse);

describe("OmzetanalyseTabs", () => {
  it("renders both tabs and switches between them", async () => {
    const user = userEvent.setup();
    render(
      <OmzetanalyseTabs
        initialTab="dashboard"
        dashboard={<div>dash-content</div>}
        detail={<div>detail-content</div>}
      />
    );
    expect(screen.getByRole("tab", { name: "Dashboard" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("dash-content")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Detailrapport" }));
    expect(screen.getByRole("tab", { name: "Detailrapport" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("detail-content")).toBeVisible();
    expect(window.location.search).toContain("tab=detail");
  });

  it("honours initialTab=detail", () => {
    render(<OmzetanalyseTabs initialTab="detail" dashboard={<div>d</div>} detail={<div>x</div>} />);
    expect(screen.getByRole("tab", { name: "Detailrapport" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("HeroKpis", () => {
  it("shows value, delta, kpis and the caveat footnote", () => {
    const hero = computeHero(pd, 1, "totaal");
    render(
      <HeroKpis model={pd} hero={hero} type="totaal" focusLabel="2025" isYtd={false} who="alle 4 dealers" />
    );
    expect(screen.getByTestId("hero-value").textContent).toContain("4.000");
    expect(screen.getByTestId("hero-delta").textContent).toContain("2024");
    expect(screen.getAllByTestId("hero-kpi")).toHaveLength(4);
    expect(screen.getByTestId("omzet-caveat").textContent).toContain("NOMALED.*-artikelen");
  });
});

describe("DealersTable", () => {
  const rows = () => screen.getAllByTestId("dealer-row").map((r) => within(r).getAllByRole("button")[0].textContent);

  it("hides dealers with zero omzet everywhere, toggles them in, searches and sorts", async () => {
    const user = userEvent.setup();
    render(<DealersTable model={pd} focusIdx={0} type="totaal" onSelect={() => {}} />);
    // Gamma has omzet in earlier years; only Delta (zero everywhere) is hidden.
    expect(rows()).toEqual(["Alfa Licht", "Beta Verlichting", "Gamma Zonder Omzet Nu"]);
    expect(screen.getByText(/Verborgen: 1 dealer zonder omzet/)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox"));
    expect(rows()).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: /^Dealer/ }));
    expect(rows()).toEqual(["Alfa Licht", "Beta Verlichting", "Delta Leegganger", "Gamma Zonder Omzet Nu"]);
    await user.click(screen.getByRole("button", { name: /^Dealer/ }));
    expect(rows()[0]).toBe("Gamma Zonder Omzet Nu");

    await user.type(screen.getByLabelText("Zoek dealer"), "beta");
    expect(rows()).toEqual(["Beta Verlichting"]);
  });

  it("calls onSelect when a row is clicked", async () => {
    const user = userEvent.setup();
    const picked: number[] = [];
    render(<DealersTable model={pd} focusIdx={0} type="totaal" onSelect={(k) => picked.push(k)} />);
    await user.click(screen.getAllByTestId("dealer-row")[1]);
    expect(picked).toEqual([102]);
  });

  it("shows a notice instead of the table without per-dealer data", () => {
    render(<DealersTable model={buildDashboardModel(jarenResponse)} focusIdx={0} type="totaal" onSelect={() => {}} />);
    expect(screen.getByTestId("section-notice").textContent).toContain("Geen per-dealer data");
    expect(screen.queryByTestId("dealers-table")).not.toBeInTheDocument();
  });

  it("PERIODE mode shows value and orders only", () => {
    const m = buildDashboardModel(perDealerPeriodeResponse);
    render(<DealersTable model={m} focusIdx={0} type="totaal" onSelect={() => {}} />);
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Dealer", "Omzet ▼", "Orders"]);
  });
});

describe("OmzetanalyseDashboard", () => {
  it("renders sections for per-dealer data and opens the drawer on row click", async () => {
    const user = userEvent.setup();
    render(<OmzetanalyseDashboard model={pd} initialFocus="2025" />);
    expect(screen.getByText("Zo evolueert de omzet")).toBeInTheDocument();
    expect(screen.getByText("Wat er verkoopt")).toBeInTheDocument();
    const chips = within(screen.getByRole("group", { name: "Focusjaar" }));
    expect(chips.getByRole("button", { name: /^2025/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(chips.getByRole("button", { name: /^2024/ }));
    expect(window.location.search).toContain("focus=2024");
    await user.click(screen.getAllByTestId("dealer-row")[0]);
    expect(await screen.findByText(/^#\d+ van \d+ dealers met omzet$/)).toBeInTheDocument();
  });

  it("filters the whole dashboard on a dealer selection", async () => {
    const user = userEvent.setup();
    render(<OmzetanalyseDashboard model={pd} initialFocus="2025" />);
    await user.click(screen.getByRole("button", { name: /^Alle dealers \(/ }));
    await user.click(screen.getByRole("checkbox", { name: /Alfa Licht/ }));
    // the picker trigger and the remaining table row both carry the name
    expect(screen.getAllByRole("button", { name: "Alfa Licht" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId("dealer-row")).toHaveLength(1);
    expect(screen.getByText("Wis filters")).toBeInTheDocument();
    await user.click(screen.getByText("Wis filters"));
    expect(screen.getAllByTestId("dealer-row").length).toBeGreaterThan(1);
  });

  it("PERIODE mode hides the evolution chart behind a notice", () => {
    render(<OmzetanalyseDashboard model={buildDashboardModel(perDealerPeriodeResponse)} />);
    expect(screen.getAllByText(/Niet beschikbaar bij een periodefilter/).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("evolution-column")).not.toBeInTheDocument();
  });
});
