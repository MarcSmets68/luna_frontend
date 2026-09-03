import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KlantContactenList } from "../klant-contacten-list";
import type { KlantContactItem } from "@/lib/api-client";

const mockItems: KlantContactItem[] = [
  {
    klnr: 14644,
    lijnnr: 1,
    naam: "Janssens",
    voornaam: "Jan",
    aanspreking: "Dhr.",
    netTel: "",
    tel: "03 123 45 67",
    gsm: "0470 12 34 56",
    email: "jan@conelighting.be",
    standaard: true,
    opm: "",
    soort: "",
  },
];

describe("KlantContactenList", () => {
  it("renders the section heading", () => {
    render(<KlantContactenList items={mockItems} />);
    expect(screen.getByRole("heading", { name: "Contactpersonen" })).toBeInTheDocument();
  });

  it("renders every item's naam, voornaam, tel, gsm and email", () => {
    render(<KlantContactenList items={mockItems} />);
    expect(screen.getByText("Janssens")).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("03 123 45 67")).toBeInTheDocument();
    expect(screen.getByText("0470 12 34 56")).toBeInTheDocument();
    expect(screen.getByText("jan@conelighting.be")).toBeInTheDocument();
  });

  it("does not render aanspreking, opm or soort columns", () => {
    render(<KlantContactenList items={mockItems} />);
    expect(screen.queryByText("Dhr.")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Aanspreking" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Opm" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Soort" })).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no items", () => {
    render(<KlantContactenList items={[]} />);
    expect(
      screen.getByText("Geen contactpersonen gevonden voor deze klant.")
    ).toBeInTheDocument();
  });
});

