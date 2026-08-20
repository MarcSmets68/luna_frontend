import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BestellingDetailPage } from "../bestelling-detail-page";
import type { BestelorderItem, BestelorderLijnItem } from "@/lib/api-client";

const mockBestelling: BestelorderItem = {
  ordnr: 2169001,
  stempel: "V",
  datum: "2026-07-17",
  levnr: 655,
  naam: "Alcom electronics nv",
  stad: "Kontich",
  munt: "USD",
  bedrag: 205.7,
  levDatum: null,
  geparkeerd: false,
  uRef: "PO-456",
  opm: "Some remark",
};

const mockLijnen: BestelorderLijnItem[] = [
  {
    ordnr: 2169001,
    lijnnr: 10,
    artnr: "ART-1",
    omschrijving: "Testartikel",
    aantal: 5,
    teLeveren: 5,
    vprijs: 10.5,
    korting: 0,
    btwKode: "1",
    bedrag: 52.5,
    stempel: "O",
    levnr: 655,
    levDatum: null,
    bonnr: 0,
    blijnnr: 0,
    volgnr: 0,
    opm: "",
  },
];

describe("BestellingDetailPage", () => {
  it("renders the ordnr as heading", () => {
    render(<BestellingDetailPage bestelling={mockBestelling} lijnen={mockLijnen} />);
    expect(screen.getByRole("heading", { name: "Bestelling 2169001" })).toBeInTheDocument();
  });

  it("renders identification and supplier fields", () => {
    render(<BestellingDetailPage bestelling={mockBestelling} lijnen={mockLijnen} />);
    expect(screen.getByText("Alcom electronics nv")).toBeInTheDocument();
    expect(screen.getByText("Kontich")).toBeInTheDocument();
    expect(screen.getByText("205,70")).toBeInTheDocument();
  });

  it("renders every orderlijn", () => {
    render(<BestellingDetailPage bestelling={mockBestelling} lijnen={mockLijnen} />);
    expect(screen.getByText("ART-1")).toBeInTheDocument();
    expect(screen.getByText("Testartikel")).toBeInTheDocument();
  });

  it("labels the orderlijnen price columns as inkoopprijs/kost, not verkoopprijs", () => {
    render(<BestellingDetailPage bestelling={mockBestelling} lijnen={mockLijnen} />);
    expect(screen.getByRole("columnheader", { name: "Inkoopprijs" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Kost" })).toBeInTheDocument();
    expect(screen.getByText(/wat aan de leverancier wordt betaald/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no orderlijnen", () => {
    render(<BestellingDetailPage bestelling={mockBestelling} lijnen={[]} />);
    expect(screen.getByText("Geen orderlijnen gevonden.")).toBeInTheDocument();
  });
});
