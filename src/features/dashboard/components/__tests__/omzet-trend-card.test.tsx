import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OmzetTrendCard } from "../omzet-trend-card";
import type { DashboardOmzetTrendItem } from "@/lib/api-client";

const items: DashboardOmzetTrendItem[] = [
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
    expect(screen.getByText("Omzet 6 maanden")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders exactly 6 circles, one per data point", () => {
    const { container } = render(<OmzetTrendCard items={items} />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(6);
  });

  it("renders the last circle (current partial month) as white", () => {
    const { container } = render(<OmzetTrendCard items={items} />);
    const circles = container.querySelectorAll("circle");
    const lastCircle = circles[circles.length - 1];
    expect(lastCircle).toHaveAttribute("fill", "white");
  });

  it("renders a dashed line between the last two points", () => {
    const { container } = render(<OmzetTrendCard items={items} />);
    const dashedLine = container.querySelector('line[stroke-dasharray="4 2"]');
    expect(dashedLine).toBeInTheDocument();
  });

  it("renders all 6 month labels", () => {
    render(<OmzetTrendCard items={items} />);
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });
});
