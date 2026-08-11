import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtikelNotFound } from "../artikel-not-found";

describe("ArtikelNotFound", () => {
  it("renders the heading and the artnr", () => {
    render(<ArtikelNotFound artnr="ZZZ999" />);
    expect(screen.getByRole("heading", { name: "Artikel niet gevonden" })).toBeInTheDocument();
    expect(screen.getByText(/Artikel ZZZ999 bestaat niet of is verwijderd\./)).toBeInTheDocument();
  });
});
