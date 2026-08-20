import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BonNotFound } from "../bon-not-found";

describe("BonNotFound", () => {
  it("renders the heading and the bonnr", () => {
    render(<BonNotFound bonnr={999999} />);
    expect(screen.getByRole("heading", { name: "Order niet gevonden" })).toBeInTheDocument();
    expect(screen.getByText(/Order 999999 bestaat niet of is verwijderd\./)).toBeInTheDocument();
  });
});
