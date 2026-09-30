import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanningRow } from "../planning-row";

const base = {
  bonnr: 123,
  groepnr: 2,
  lijnnr: 5,
  klant: "Acme",
  artnr: "ART-1",
  omschrijving: "LED profiel",
  aantal: 4,
  levDatum: "2026-10-02",
};

describe("PlanningRow", () => {
  it("renders bon, klant, article and quantity", () => {
    render(<PlanningRow item={base} />);
    expect(screen.getByText("Bon 123 / 2")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("ART-1 \u00b7 LED profiel")).toBeInTheDocument();
    expect(screen.getByText("4\u00d7")).toBeInTheDocument();
    expect(screen.queryByText(/Lev:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("omits the dangling separator when a part is blank", () => {
    const { rerender } = render(<PlanningRow item={{ ...base, omschrijving: "" }} />);
    expect(screen.getByText("ART-1")).toBeInTheDocument();
    rerender(<PlanningRow item={{ ...base, artnr: " " }} />);
    expect(screen.getByText("LED profiel")).toBeInTheDocument();
    rerender(<PlanningRow item={{ ...base, artnr: "", omschrijving: "" }} />);
    expect(screen.queryByText(/\u00b7/)).not.toBeInTheDocument();
  });

  it("shows the formatted date when showDate is set", () => {
    render(<PlanningRow item={base} showDate />);
    expect(screen.getByText("Lev: 02/10/2026")).toBeInTheDocument();
  });
});
