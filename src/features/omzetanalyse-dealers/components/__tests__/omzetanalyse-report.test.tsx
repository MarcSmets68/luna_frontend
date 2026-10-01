import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OmzetanalyseResponse } from "@/lib/api-client";
import { OmzetanalyseReport } from "../omzetanalyse-report";
import { jarenResponse, periodeResponse, sectie } from "../../test-utils/fixtures";

describe("OmzetanalyseReport", () => {
  it("JAREN mode shows 5 year columns and growth badges", () => {
    render(<OmzetanalyseReport response={jarenResponse} />);
    const table = screen.getAllByTestId("categorie-table")[0];
    for (const y of ["2026", "2025", "2024", "2023", "2022"]) {
      expect(within(table).getByRole("columnheader", { name: y })).toBeInTheDocument();
    }
    const badges = screen.getAllByTestId("growth-badge").map((b) => b.textContent);
    expect(badges).toContain("+12,3\u00A0%");
    expect(badges).toContain("\u22124,0\u00A0%");
  });

  it("PERIODE mode shows one column and no growth badges", () => {
    render(<OmzetanalyseReport response={periodeResponse} />);
    expect(screen.getAllByRole("columnheader", { name: "01/01/2026 t/m 31/03/2026" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("2026")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("growth-badge")).toHaveLength(0);
  });

  it("shows artnr with ellipsis for prefix matches and the unit badge", () => {
    render(<OmzetanalyseReport response={periodeResponse} />);
    expect(screen.getByText("LS100\u2026")).toBeInTheDocument();
    expect(screen.getByText("m")).toBeInTheDocument();
  });

  it("shows the qty subtotal normally but hides it for mixed-unit categories", () => {
    const { unmount } = render(<OmzetanalyseReport response={periodeResponse} />);
    expect(screen.getByTestId("qty-subtotal")).toBeInTheDocument();
    unmount();
    render(
      <OmzetanalyseReport response={{ ...periodeResponse, secties: [sectie(1, {}, true)] }} />
    );
    expect(screen.queryByTestId("qty-subtotal")).not.toBeInTheDocument();
    expect(within(screen.getByTestId("categorie-table")).getByText("Aantal orders")).toBeInTheDocument();
  });

  it("renders em-dash for null values", () => {
    render(<OmzetanalyseReport response={periodeResponse} />);
    expect(screen.getAllByText("\u2014").length).toBeGreaterThan(0);
  });

  it("renders one heading per dealer section, none in normal mode", () => {
    const res: OmzetanalyseResponse = {
      ...periodeResponse,
      secties: [
        sectie(1, { dealerKlnr: 1, dealerNaam: "Alfa" }),
        sectie(1, { dealerKlnr: 2, dealerNaam: "Beta" }),
      ],
    };
    const { unmount } = render(<OmzetanalyseReport response={res} />);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Alfa (1)",
      "Beta (2)",
    ]);
    unmount();
    render(<OmzetanalyseReport response={periodeResponse} />);
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("renders the empty state", () => {
    render(<OmzetanalyseReport response={{ ...periodeResponse, secties: [] }} />);
    expect(screen.getByText("Geen data gevonden voor deze selectie")).toBeInTheDocument();
  });
});
