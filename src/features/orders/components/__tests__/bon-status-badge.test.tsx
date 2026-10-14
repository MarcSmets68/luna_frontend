import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BonStatusBadge } from "../bon-status-badge";

describe("BonStatusBadge", () => {
  it.each([
    ["O", "Open"],
    ["V", "In verwerking"],
    ["B", "Besteld"],
    ["D", "Afgeleverd"],
  ])("renders %s as %s", (stempel, label) => {
    render(<BonStatusBadge stempel={stempel} />);
    expect(screen.getByText(label)).toHaveAttribute("data-stempel", stempel);
  });

  it("shows the raw value for an unknown stempel", () => {
    render(<BonStatusBadge stempel="X" />);
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it("shows Onbekend for an empty stempel", () => {
    render(<BonStatusBadge stempel="" />);
    expect(screen.getByText("Onbekend")).toBeInTheDocument();
  });
});
