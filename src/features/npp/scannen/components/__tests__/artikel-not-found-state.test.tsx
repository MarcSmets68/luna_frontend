import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtikelNotFoundState } from "../artikel-not-found-state";

describe("ArtikelNotFoundState", () => {
  it("shows an explicit not-found message including the scanned value", () => {
    render(<ArtikelNotFoundState scan="garbage" />);
    expect(screen.getByText("Artikel niet gevonden")).toBeInTheDocument();
    expect(screen.getByText(/garbage/)).toBeInTheDocument();
  });
});
