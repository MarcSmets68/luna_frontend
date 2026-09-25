import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OmzetTrendCard } from "../omzet-trend-card";
import type { DashboardOmzetTrendItem } from "@/lib/api-client";

const items: DashboardOmzetTrendItem[] = [
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
];

describe("OmzetTrendCard", () => {
  it("renders the card title", () => {
    const { container } = render(<OmzetTrendCard items={items} />);
    expect(screen.getByText("Omzet 12 maanden")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders exactly 12 circles, one per data point", () => {
    const { container } = render(<OmzetTrendCard items={items} />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(12);
  });

  it("renders the last circle (current partial month) as white", () => {
    const { container } = render(<OmzetTrendCard items={items} />);
    const circles = container.querySelectorAll("circle");
    const lastCircle = circles[circles.length - 1];
    expect(lastCircle).toHaveAttribute("fill", "white");
  });

  it("renders a dashed line between the last two points", () => {
    const { container } = render(<OmzetTrendCard items={items} />);
    const dashedLine = container.querySelector('line[stroke-dasharray="9 6"]');
    expect(dashedLine).toBeInTheDocument();
  });

  it("renders all 12 month labels", () => {
    render(<OmzetTrendCard items={items} />);
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it("renders exactly 3 y-axis tick labels", () => {
    render(<OmzetTrendCard items={items} />);
    expect(screen.getByText("€ 86k")).toBeInTheDocument();
    expect(screen.getByText("€ 43k")).toBeInTheDocument();
    expect(screen.getByText("€ 0")).toBeInTheDocument();
  });

  it("renders exactly 3 gridlines", () => {
    const { container } = render(<OmzetTrendCard items={items} />);
    const gridlines = container.querySelectorAll('line[stroke="#d9d9d9"]');
    expect(gridlines).toHaveLength(3);
    for (const gridline of gridlines) {
      expect(gridline).not.toHaveAttribute("stroke-dasharray");
    }
  });

  it("svg viewBox reflects widened layout", () => {
    const { container } = render(<OmzetTrendCard items={items} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 1230 360");
  });
});
