import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtikelMultipleFoundState } from "../artikel-multiple-found-state";

describe("ArtikelMultipleFoundState", () => {
  it("shows the static ambiguous-scan message", () => {
    render(<ArtikelMultipleFoundState />);
    expect(
      screen.getByText(
        "Meerdere artikelen gevonden voor deze scan. Neem contact op met de administratie."
      )
    ).toBeInTheDocument();
  });
});
