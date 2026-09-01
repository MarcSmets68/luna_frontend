import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TestModeBanner } from "../test-mode-banner";

describe("TestModeBanner", () => {
  it("shows the banner text when active", () => {
    render(<TestModeBanner active />);
    expect(
      screen.getByText("TEST MODE — alle gebruikers hebben tijdelijk adminrechten")
    ).toBeInTheDocument();
  });

  it("renders nothing when not active", () => {
    render(<TestModeBanner active={false} />);
    expect(
      screen.queryByText("TEST MODE — alle gebruikers hebben tijdelijk adminrechten")
    ).not.toBeInTheDocument();
  });
});
