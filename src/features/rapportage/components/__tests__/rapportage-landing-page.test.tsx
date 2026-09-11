import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RapportageLandingPage } from "../rapportage-landing-page";

describe("RapportageLandingPage", () => {
  it("renders the page title and the Verkoop FUR report card with a link to it", () => {
    render(<RapportageLandingPage />);

    expect(screen.getByRole("heading", { name: "Rapportage" })).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Verkoop FUR/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/rapportage/verkoop-fur");
    expect(
      screen.getByText(/Overzicht van dealers met NOMALED\.FUR-orders/)
    ).toBeInTheDocument();
  });
});
