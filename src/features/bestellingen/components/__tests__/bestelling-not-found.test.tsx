import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BestellingNotFound } from "../bestelling-not-found";

describe("BestellingNotFound", () => {
  it("renders the not-found heading and message with the given ordnr", () => {
    render(<BestellingNotFound ordnr="999999" />);
    expect(screen.getByRole("heading", { name: "Bestelling niet gevonden" })).toBeInTheDocument();
    expect(screen.getByText(/Bestelling 999999 bestaat niet/)).toBeInTheDocument();
  });
});
