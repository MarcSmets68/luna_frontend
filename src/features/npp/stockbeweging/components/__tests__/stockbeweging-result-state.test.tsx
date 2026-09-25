import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StockbewegingResultState } from "../stockbeweging-result-state";

describe("StockbewegingResultState", () => {
  it("shows the new voorraad/magazijn straight from the server response", () => {
    render(
      <StockbewegingResultState
        result={{
          artikel: { artnr: "ART-1", voorraad: 42, magazijn: "M1" },
          artlog: {
            artnr: "ART-1",
            lijnnr: 1,
            datum: "2026-01-01",
            uur: "10:00",
            beweging: "ontvangst",
            aantal: 5,
            stock: 42,
            opm: "Ontvangst levering",
            id: "1",
          },
        }}
        onReset={() => {}}
      />
    );

    expect(screen.getByText("Boeking geslaagd")).toBeInTheDocument();
    expect(screen.getByText("ART-1")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("M1")).toBeInTheDocument();
  });

  it("calls onReset when 'Nieuwe boeking' is clicked", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(
      <StockbewegingResultState
        result={{
          artikel: { artnr: "ART-1", voorraad: 42, magazijn: "M1" },
          artlog: {
            artnr: "ART-1",
            lijnnr: 1,
            datum: "2026-01-01",
            uur: "10:00",
            beweging: "ontvangst",
            aantal: 5,
            stock: 42,
            opm: "Ontvangst levering",
            id: "1",
          },
        }}
        onReset={onReset}
      />
    );

    await user.click(screen.getByRole("button", { name: "Nieuwe boeking" }));
    expect(onReset).toHaveBeenCalled();
  });
});
