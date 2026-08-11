import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LakproductiePage } from "../lakproductie-page";
import type { LakproductieItem } from "@/lib/api-client";

const mockItems: LakproductieItem[] = [
  {
    bonnr: 2177435,
    klant: "CONE LIGHTING BV",
    artnr: "SAPA.RAE.46990.AT",
    omschrijving: "1D LED profiel 30,2x41mm ANO TITANIUM BRUSHED per meter",
    aantal: 6,
    behandeling: "ALDOR.E.1D.00.AT.TITANIUM",
    techniek: "ANO",
    kleursoort: "",
    kleurkode: "TITANIUM",
    afwerking: "",
    groepeerKleur: "ANO · TITANIUM",
    orderdatum: "2026-07-15",
    leverdatum: "2026-08-04",
  },
  {
    bonnr: 2177999,
    klant: "ANOTHER CLIENT BV",
    artnr: "SAPA.RAE.12345.AT",
    omschrijving: "2D LED profiel 20x30mm poedercoating",
    aantal: 3,
    behandeling: "ALCO.LAK.BASE.30x30CM.RAL9005.STRUCTUUR",
    techniek: "LAK",
    kleursoort: "RAL",
    kleurkode: "9005",
    afwerking: "Structuurlak",
    groepeerKleur: "LAK · RAL 9005 · Structuurlak",
    orderdatum: "2026-07-16",
    leverdatum: "2026-08-05",
  },
  {
    bonnr: 2178050,
    klant: "THIRD CLIENT BV",
    artnr: "SAPA.RAE.99999.AT",
    omschrijving: "3D LED profiel 40x50mm",
    aantal: 2,
    behandeling: "WIL.101270.9016.COATEX",
    techniek: "",
    kleursoort: "",
    kleurkode: "",
    afwerking: "",
    groepeerKleur: "WIL.101270.9016.COATEX",
    orderdatum: "2026-07-17",
    leverdatum: "2026-08-06",
  },
];

describe("LakproductiePage", () => {
  it("renders the page heading", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(screen.getByRole("heading", { name: "Lakproduktie" })).toBeInTheDocument();
  });

  it("renders every item's order, klant and artikel", () => {
    render(<LakproductiePage items={mockItems} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.bonnr))).toBeInTheDocument();
      expect(screen.getByText(item.klant)).toBeInTheDocument();
      expect(screen.getByText(item.artnr)).toBeInTheDocument();
    }
  });

  it("shows an empty state when there are no items", () => {
    render(<LakproductiePage items={[]} />);
    expect(
      screen.getByText("Geen artikelen gevonden die nog gelakt of geanodiseerd moeten worden.")
    ).toBeInTheDocument();
  });

  it("groups order lines per artikel-level behandeling code", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(
      screen.getByRole("heading", { name: /ALDOR\.E\.1D\.00\.AT\.TITANIUM/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ALCO\.LAK\.BASE\.30x30CM\.RAL9005\.STRUCTUUR/ })
    ).toBeInTheDocument();
  });

  it("shows the derived techniek/kleurkode/afwerking label next to the title when it could be derived", () => {
    render(<LakproductiePage items={mockItems} />);
    const anoHeading = screen.getByRole("heading", { name: /ALDOR\.E\.1D\.00\.AT\.TITANIUM/ });
    expect(anoHeading).toHaveTextContent("ANO · TITANIUM");

    const lakHeading = screen.getByRole("heading", {
      name: /ALCO\.LAK\.BASE\.30x30CM\.RAL9005\.STRUCTUUR/,
    });
    expect(lakHeading).toHaveTextContent("LAK · RAL 9005 · Structuurlak");
  });

  it("shows no extra label when nothing could be derived from the behandeling code", () => {
    render(<LakproductiePage items={mockItems} />);
    const unknownHeading = screen.getByRole("heading", { name: "WIL.101270.9016.COATEX" });
    expect(unknownHeading).toHaveTextContent("WIL.101270.9016.COATEX");
  });
});
