import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KlantNotFound } from "../klant-not-found";

describe("KlantNotFound", () => {
  it("renders the heading and the klnr", () => {
    render(<KlantNotFound klnr={999999} />);
    expect(screen.getByRole("heading", { name: "Klant niet gevonden" })).toBeInTheDocument();
    expect(screen.getByText(/Klant 999999 bestaat niet of is verwijderd\./)).toBeInTheDocument();
  });
});
