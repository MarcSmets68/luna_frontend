import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanningDayGroup } from "../planning-day-group";
import type { PlanningQueueItem } from "../../types";

function mk(bonnr: number, lijnnr: number, levDatum: string | null): PlanningQueueItem {
  return { bonnr, groepnr: 1, lijnnr, klant: "K", artnr: "A", omschrijving: "O", aantal: 1, levDatum };
}

describe("PlanningDayGroup", () => {
  it("renders label, count and rows; no date on normal rows", () => {
    render(
      <PlanningDayGroup
        group={{
          key: "2026-10-07",
          label: "Vandaag",
          tone: "normal",
          items: [mk(1, 1, "2026-10-07"), mk(1, 2, "2026-10-07")],
        }}
      />
    );
    expect(screen.getByRole("heading", { name: "Vandaag" })).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getAllByText("Bon 1 / 1")).toHaveLength(2);
    expect(screen.queryByText(/Lev:/)).not.toBeInTheDocument();
  });

  it("uses the warning style and shows each row's date when overdue", () => {
    render(
      <PlanningDayGroup
        group={{
          key: "overdue",
          label: "Achterstallig",
          tone: "overdue",
          items: [mk(1, 1, "2026-10-02"), mk(2, 1, "2026-10-05")],
        }}
      />
    );
    expect(screen.getByRole("heading", { name: "Achterstallig" }).className).toContain("bg-warning-bg");
    expect(screen.getByText("Lev: 02/10/2026")).toBeInTheDocument();
    expect(screen.getByText("Lev: 05/10/2026")).toBeInTheDocument();
  });
});
