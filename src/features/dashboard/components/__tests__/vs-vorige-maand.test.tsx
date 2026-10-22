import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VsVorigeMaand } from "../vs-vorige-maand";

describe("VsVorigeMaand", () => {
  it("shows up arrow in success color for positive", () => {
    render(<VsVorigeMaand value={21.4} />);
    const el = screen.getByTestId("vs-vorige-maand");
    expect(el).toHaveTextContent("↑ 21,4% vs vorige maand");
    expect(el).toHaveClass("text-success-fg");
  });

  it("shows down arrow in destructive color for negative", () => {
    render(<VsVorigeMaand value={-9.7} />);
    const el = screen.getByTestId("vs-vorige-maand");
    expect(el).toHaveTextContent("↓ 9,7% vs vorige maand");
    expect(el).toHaveClass("text-destructive");
  });

  it("shows fallback text for null", () => {
    render(<VsVorigeMaand value={null} />);
    expect(screen.getByText("geen data vorige maand")).toBeInTheDocument();
  });
});
