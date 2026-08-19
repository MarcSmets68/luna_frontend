import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfferteNotFound } from "../offerte-not-found";

describe("OfferteNotFound", () => {
  it("renders the heading and the offnr/versie", () => {
    render(<OfferteNotFound offnr={999999} versie={2} />);
    expect(screen.getByRole("heading", { name: "Offerte niet gevonden" })).toBeInTheDocument();
    expect(screen.getByText(/Offerte 999999\/2 bestaat niet of is verwijderd\./)).toBeInTheDocument();
  });
});
