import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LakproductiePage } from "../lakproductie-page";
import type { LakproductieItem } from "@/lib/api-client";

const baseFields: Omit<
  LakproductieItem,
  | "bron"
  | "bonnr"
  | "klant"
  | "artnr"
  | "omschrijving"
  | "aantal"
  | "behandeling"
  | "techniek"
  | "kleursoort"
  | "kleurkode"
  | "afwerking"
  | "groepeerKleur"
  | "orderDatum"
  | "deadline"
  | "lakNaam"
  | "status"
  | "bestelAdvies"
> = {
  ledAlu: "SAPA.RAE.46990.BRUT",
  ledType: "Profiel",
  ledKenmerk: "-----",
  typeAfwerking: "ANO",
  lakLevnr: 623,
  voorraad: 100,
  gereserveerdVoorraad: 10,
  extVoorraad: 0,
  extGereserveerd: 0,
  voorbewerkingNodig: false,
  premontageDatum: null,
  verkoop1Maand: 1,
  verkoop3Maand: 2,
  verkoop6Maand: 3,
  verkoop9Maand: 4,
  verkoop12Maand: 5,
  lijnnr: null,
  prodLijnnr: null,
  groepnr: null,
  subgroepnr: null,
  lijnGereserveerd: null,
  lijnBesteld: null,
  ordnr: null,
  orderLevnr: null,
  orderNaam: null,
  maatBevestigd: null,
  kleurOnbepaald: false,
};

const mockItems: LakproductieItem[] = [
  {
    ...baseFields,
    bron: "lopende-orders",
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
    orderDatum: "2026-07-15",
    deadline: "2026-08-04",
    lakNaam: "ALUCOL BV",
    status: "Gereserveerd",
    bestelAdvies: null,
  },
  // Same derived techniek/kleurkode/afwerking as the item above (ANO ·
  // TITANIUM) but a different raw behandeling spec - must land in the same
  // top-level kleur/techniek/afwerking group, as its own behandeling
  // subgroup within it.
  {
    ...baseFields,
    bron: "lopende-productielijnen",
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
    orderDatum: "2026-07-15",
    deadline: "2026-08-04",
    lakNaam: "ALUCOL BV",
    status: "Deels gereserveerd",
    bestelAdvies: null,
    prodLijnnr: 42,
  },
  {
    ...baseFields,
    bron: "lopende-orders",
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
    orderDatum: "2026-07-16",
    deadline: "2026-08-05",
    lakNaam: "Wilms Lakkerij",
    status: "Besteld",
    bestelAdvies: null,
  },
  {
    ...baseFields,
    bron: "lopende-orders",
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
    orderDatum: "2026-07-17",
    deadline: "2026-08-06",
    lakNaam: "ALUCOL BV",
    status: "Nog te bestellen",
    bestelAdvies: null,
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
      expect(screen.getByText(item.klant ?? "\u2014")).toBeInTheDocument();
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
      bron: "lopende-orders",
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
      orderDatum: "2026-07-18",
      deadline: "2026-08-07",
      lakNaam: "ALUCOL BV",
      status: "Gereserveerd",
      bestelAdvies: null,
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

  it("shows a bron badge for every row, labelling each of the three sources", () => {
    const minMaxItem: LakproductieItem = {
      ...baseFields,
      bron: "min-max-voorraad",
      bonnr: null,
      klant: null,
      artnr: "SAPA.RAE.77777.AT",
      omschrijving: "Min-max voorraaditem",
      aantal: null,
      behandeling: "MINMAX.9005",
      techniek: "LAK",
      kleursoort: "RAL",
      kleurkode: "9005",
      afwerking: "",
      groepeerKleur: "LAK · RAL 9005",
      orderDatum: null,
      deadline: null,
      lakNaam: "Wilms Lakkerij",
      status: null,
      bestelAdvies: 25,
    };
    render(<LakproductiePage items={[...mockItems, minMaxItem]} />);
    expect(screen.getAllByText("Order").length).toBeGreaterThan(0);
    expect(screen.getByText("Productielijn")).toBeInTheDocument();
    expect(screen.getByText("Min-max")).toBeInTheDocument();
  });

  it("shows a status badge for lopende-orders/lopende-productielijnen rows", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(screen.getByText("Gereserveerd")).toBeInTheDocument();
    expect(screen.getByText("Deels gereserveerd")).toBeInTheDocument();
    expect(screen.getByText("Besteld")).toBeInTheDocument();
    expect(screen.getByText("Nog te bestellen")).toBeInTheDocument();
  });

  it("hides order/klant/aantal and shows a bestel-advies for min-max-voorraad rows instead", () => {
    const minMaxItem: LakproductieItem = {
      ...baseFields,
      bron: "min-max-voorraad",
      bonnr: null,
      klant: null,
      artnr: "SAPA.RAE.77777.AT",
      omschrijving: "Min-max voorraaditem",
      aantal: null,
      behandeling: "MINMAX.9005",
      techniek: "LAK",
      kleursoort: "RAL",
      kleurkode: "9005",
      afwerking: "",
      groepeerKleur: "LAK · RAL 9005",
      orderDatum: null,
      deadline: null,
      lakNaam: "Wilms Lakkerij",
      status: null,
      bestelAdvies: 25,
    };
    render(<LakproductiePage items={[minMaxItem]} />);

    // No bonnr/klant/aantal (order-only fields) rendered for this row.
    expect(screen.queryByText("2177435")).not.toBeInTheDocument();
    expect(screen.queryByText("CONE LIGHTING BV")).not.toBeInTheDocument();

    // Bestel-advies value shown instead of a status badge.
    expect(screen.getByText(/Bestel-advies:\s*25/)).toBeInTheDocument();

    // Em-dashes shown for the inapplicable order/klant/aantal columns.
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows gereserveerdVoorraad (renamed from gereserveerd) in the per-row detail line", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(screen.getAllByText(/Gereserveerd 10/).length).toBeGreaterThan(0);
  });

  it("renders a bestelAdvies of 0 as \"0\", not as a dash", () => {
    const zeroAdviesItem: LakproductieItem = {
      ...baseFields,
      bron: "min-max-voorraad",
      bonnr: null,
      klant: null,
      artnr: "SAPA.RAE.88888.AT",
      omschrijving: "Min-max voorraaditem zonder bestel-advies",
      aantal: null,
      behandeling: "MINMAX.0000",
      techniek: "LAK",
      kleursoort: "RAL",
      kleurkode: "0000",
      afwerking: "",
      groepeerKleur: "LAK · RAL 0000",
      orderDatum: null,
      deadline: null,
      lakNaam: "Wilms Lakkerij",
      status: null,
      bestelAdvies: 0,
    };
    render(<LakproductiePage items={[zeroAdviesItem]} />);
    expect(screen.getByText(/Bestel-advies:\s*0(?!\S)/)).toBeInTheDocument();
  });
});
