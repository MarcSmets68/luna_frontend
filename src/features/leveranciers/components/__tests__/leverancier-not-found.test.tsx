import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeverancierNotFound } from "../leverancier-not-found";

describe("LeverancierNotFound", () => {
  it("renders the heading and the levnr", () => {
    render(<LeverancierNotFound levnr={999999} />);
    expect(screen.getByRole("heading", { name: "Leverancier niet gevonden" })).toBeInTheDocument();
    expect(
      screen.getByText(/Leverancier 999999 bestaat niet of is verwijderd\./)
    ).toBeInTheDocument();
  });
});
