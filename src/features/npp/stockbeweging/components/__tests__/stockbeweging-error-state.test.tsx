import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StockbewegingErrorState } from "../stockbeweging-error-state";

describe("StockbewegingErrorState", () => {
  it("renders the message verbatim, without reinterpreting it", () => {
    render(
      <StockbewegingErrorState message="Onvoldoende voorraad voor deze boeking (huidige voorraad: 3)" />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Onvoldoende voorraad voor deze boeking (huidige voorraad: 3)"
    );
  });
});
