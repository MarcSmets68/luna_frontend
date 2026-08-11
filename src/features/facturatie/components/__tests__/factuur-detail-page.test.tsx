import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FactuurDetailPage } from "../factuur-detail-page";
import type { FactuurItem } from "@/lib/api-client";

const mockFactuur: FactuurItem = {
  facnr: 302145,
  type: true,
  stempel: "F",
  datum: "2026-08-07",
  klnr: 14644,
  naam: "CONE LIGHTING BV",
  adres: "Catershoflaan 70-76",
  postnr: "2170",
  stad: "Merksem",
  munt: "EUR",
  uRef: "PO-123",
  oRef: "",
  vervaldat: "2026-09-06",
  swBetaald: false,
  bdatum: null,
  nBedrag: 500,
  bBedrag: 500,
  totBtw: 105,
  totaal: 605,
  voorschot: 0,
  swFactuur: true,
  projectnr: 0,
  opm: "Some remark",
};

describe("FactuurDetailPage", () => {
  it("renders the facnr as heading", () => {
    render(<FactuurDetailPage factuur={mockFactuur} />);
    expect(screen.getByRole("heading", { name: "Factuur 302145" })).toBeInTheDocument();
  });

  it("renders identification, customer and amount fields", () => {
    render(<FactuurDetailPage factuur={mockFactuur} />);
    expect(screen.getByText("CONE LIGHTING BV")).toBeInTheDocument();
    expect(screen.getByText("Merksem")).toBeInTheDocument();
    expect(screen.getByText("605,00")).toBeInTheDocument();
  });

  it("renders the betaald/status fields and remarks", () => {
    render(<FactuurDetailPage factuur={mockFactuur} />);
    expect(screen.getByText("Nee")).toBeInTheDocument();
    expect(screen.getByText("Some remark")).toBeInTheDocument();
  });
});
