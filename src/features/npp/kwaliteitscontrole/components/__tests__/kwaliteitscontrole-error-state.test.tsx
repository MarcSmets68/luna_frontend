import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KwaliteitscontroleErrorState } from "../kwaliteitscontrole-error-state";

describe("KwaliteitscontroleErrorState", () => {
  it("renders the message verbatim in an alert role", () => {
    render(<KwaliteitscontroleErrorState message="Al in bewerking door PIET" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Al in bewerking door PIET");
  });
});
