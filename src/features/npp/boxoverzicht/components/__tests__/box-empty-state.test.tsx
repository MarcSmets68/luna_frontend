import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BoxEmptyState } from "../box-empty-state";

describe("BoxEmptyState", () => {
  it("shows an explicit empty-box message", () => {
    render(<BoxEmptyState />);
    expect(screen.getByText("Deze box is leeg")).toBeInTheDocument();
    expect(
      screen.getByText("Er zijn geen artikelen gekoppeld aan deze groep.")
    ).toBeInTheDocument();
  });
});
