import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BonStatusBadge } from "../bon-status-badge";

describe("BonStatusBadge", () => {
  it('shows "Open" for stempel "O"', () => {
    render(<BonStatusBadge stempel="O" />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it('shows "In verwerking" for stempel "V"', () => {
    render(<BonStatusBadge stempel="V" />);
    expect(screen.getByText("In verwerking")).toBeInTheDocument();
  });

  it('shows "In verwerking" for stempel "B" (no distinction from "V")', () => {
    render(<BonStatusBadge stempel="B" />);
    expect(screen.getByText("In verwerking")).toBeInTheDocument();
  });

  it("falls back to the raw value for an unknown stempel", () => {
    render(<BonStatusBadge stempel="X" />);
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it('falls back to "Onbekend" for an empty stempel', () => {
    render(<BonStatusBadge stempel="" />);
    expect(screen.getByText("Onbekend")).toBeInTheDocument();
  });
}); 
