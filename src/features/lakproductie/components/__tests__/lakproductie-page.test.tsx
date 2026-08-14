import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LakproductiePage } from "../lakproductie-page";
import type { LakproductieItem } from "@/lib/api-client";

const baseFields = {
  voorraad: 100,
  gereserveerd: 10,
  extVoorraad: 0,
  extGereserveerd: 0,
  ledAlu: "SAPA.RAE.46990.BRUT",
  ledType: "Profiel",
  ledKenmerk: "-----",
  artikelTypeAfwerking: "ANO",
  lakLevnr: 623,
  lakNaam: "ALUCOL BV",
  voorbewerkingNodig: false,
  maatBevestigd: null,
  verkoop1Maand: 1,
  verkoop3Maand: 2,
  verkoop6Maand: 3,
  verkoop9Maand: 4,
  verkoop12Maand: 5,
};

const mockItems: LakproductieItem[] = [
  {
    ...baseFields,
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
  // Same derived techniek/kleurkode/afwerking as the item above (ANO ·
  // TITANIUM) but a different raw behandeling spec - must land in the same
  // top-level kleur/techniek/afwerking group, as its own behandeling
  // subgroup within it.
  {
    ...baseFields,
    bonnr: 2177500,
    klant: "SUBGROUP CLIENT BV",
    artnr: "SAPA.RAE.47000.AT",
    omschrijving: "1D LED profiel ANO TITANIUM (andere specificatie)",
    aantal: 4,
    behandeling: "ALU.1D.00.AT.1",
    techniek: "ANO",
    kleursoort: "",
    kleurkode: "TITANIUM",
    afwerking: "",
    groepeerKleur: "ANO · TITANIUM",
    orderdatum: "2026-07-15",
    leverdatum: "2026-08-04",
    lakNaam: "ALUCOL BV",
  },
  {
    ...baseFields,
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
    lakNaam: "Wilms Lakkerij",
  },
  {
    ...baseFields,
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

  it("groups order lines at the top level by techniek/kleurkode/afwerking (groepeerKleur)", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(screen.getByRole("heading", { name: "ANO · TITANIUM" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "LAK · RAL 9005 · Structuurlak" })
    ).toBeInTheDocument();
  });

  it("falls back to the raw behandeling code as the group title when nothing could be derived", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(screen.getByRole("heading", { name: "WIL.101270.9016.COATEX" })).toBeInTheDocument();
  });

  it("subgroups articles with different behandeling specs but the same techniek/kleurkode/afwerking together", () => {
    render(<LakproductiePage items={mockItems} />);
    // Both distinct behandeling specs that resolve to "ANO · TITANIUM" must
    // appear (as subgroup headings) once the top-level group is rendered.
    expect(screen.getByText("ALDOR.E.1D.00.AT.TITANIUM")).toBeInTheDocument();
    expect(screen.getByText("ALU.1D.00.AT.1")).toBeInTheDocument();
    // Both order lines are still individually visible under that one group.
    expect(screen.getByText("2177435")).toBeInTheDocument();
    expect(screen.getByText("2177500")).toBeInTheDocument();
  });

  it("shows the coating supplier (leverancier) for each order line", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(screen.getByText("Wilms Lakkerij")).toBeInTheDocument();
    expect(screen.getAllByText("ALUCOL BV").length).toBeGreaterThan(0);
  });

  it("shows a color swatch next to each group heading, matching the group's kleursoort/kleurkode", () => {
    render(<LakproductiePage items={mockItems} />);
    // "LAK · RAL 9005 · Structuurlak" -> RAL 9005 -> Jet Black (#0a0a0a).
    const ralHeading = screen.getByRole("heading", { name: "LAK · RAL 9005 · Structuurlak" });
    expect(ralHeading.querySelector("span")).toHaveStyle({ backgroundColor: "#0a0a0a" });

    // "ANO · TITANIUM" -> no kleursoort, kleurkode TITANIUM -> #C0C0C0.
    const anoHeading = screen.getByRole("heading", { name: "ANO · TITANIUM" });
    expect(anoHeading.querySelector("span")).toHaveStyle({ backgroundColor: "#C0C0C0" });

    // Nothing could be derived -> fallback grey (#9CA3AF).
    const fallbackHeading = screen.getByRole("heading", { name: "WIL.101270.9016.COATEX" });
    expect(fallbackHeading.querySelector("span")).toHaveStyle({ backgroundColor: "#9CA3AF" });
  });

  it("shows the Axalta product name/code next to the group heading for internal \"RAL n\" codes", () => {
    const axaltaItem: LakproductieItem = {
      ...baseFields,
      bonnr: 2179000,
      klant: "AXALTA CLIENT BV",
      artnr: "SAPA.RAE.55555.AT",
      omschrijving: "1D LED profiel RAL1 anodic bronze",
      aantal: 5,
      behandeling: "ALDOR.E.1D.00.RAL1",
      techniek: "ANO",
      kleursoort: "RAL",
      kleurkode: "1",
      afwerking: "",
      groepeerKleur: "ANO · 1",
      orderdatum: "2026-07-18",
      leverdatum: "2026-08-07",
    };
    render(<LakproductiePage items={[axaltaItem]} />);
    expect(
      screen.getByRole("heading", { name: "ANO · 1 (Axalta Anodic Bronze · AE20108000320)" })
    ).toBeInTheDocument();
  });

  it("does not show an Axalta label for real RAL colors (e.g. RAL 9005)", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(
      screen.getByRole("heading", { name: "LAK · RAL 9005 · Structuurlak" })
    ).toBeInTheDocument();
  });
});
