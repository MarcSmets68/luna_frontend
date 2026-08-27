import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LakproductiePage } from "../lakproductie-page";
import type { LakproductieItem } from "@/lib/api-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

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
  verpakking: 12,
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
  // TITANIUM) but a different leverancier - must land in the same
  // top-level kleur/techniek/afwerking group, as its own leverancier
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
    lakNaam: "Anogel bvba",
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

  it("renders every item's order and artikel", () => {
    render(<LakproductiePage items={mockItems} />);
    for (const item of mockItems) {
      expect(screen.getByText(String(item.bonnr))).toBeInTheDocument();
      expect(screen.getByText(item.artnr)).toBeInTheDocument();
    }
  });

  it("does not show a Klant column in the table", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(screen.queryByRole("columnheader", { name: "Klant" })).not.toBeInTheDocument();
    // Klant names aren't rendered anywhere until a row is clicked.
    expect(screen.queryByText("CONE LIGHTING BV")).not.toBeInTheDocument();
  });

  it("shows a Verpakking column with the artikel's verpakking value", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(screen.getAllByRole("columnheader", { name: "Verpakking" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
  });

  it("filters order lines by order number", () => {
    render(<LakproductiePage items={mockItems} />);
    fireEvent.change(screen.getByPlaceholderText("Ordernr."), { target: { value: "2177435" } });

    expect(screen.getByText("2177435")).toBeInTheDocument();
    expect(screen.queryByText("2177500")).not.toBeInTheDocument();
    expect(screen.queryByText("2177999")).not.toBeInTheDocument();
  });

  it("filters order lines by leverancier", async () => {
    const user = userEvent.setup();
    render(<LakproductiePage items={mockItems} />);
    await user.click(screen.getByRole("combobox", { name: "Leverancier" }));
    await user.click(await screen.findByRole("option", { name: "Wilms Lakkerij" }));

    expect(screen.getByText("2177999")).toBeInTheDocument();
    expect(screen.queryByText("2177435")).not.toBeInTheDocument();
    expect(screen.queryByText("2177500")).not.toBeInTheDocument();
  });

  it("filters order lines by bron", async () => {
    const user = userEvent.setup();
    render(<LakproductiePage items={mockItems} />);
    await user.click(screen.getByRole("combobox", { name: /bron/i }));
    await user.click(await screen.findByRole("option", { name: "Productielijn" }));

    expect(screen.getByText("2177500")).toBeInTheDocument();
    expect(screen.queryByText("2177435")).not.toBeInTheDocument();
    expect(screen.queryByText("2177999")).not.toBeInTheDocument();
  });

  it("allows editing the aantal for an order line", () => {
    render(<LakproductiePage items={mockItems} />);
    const aantalInput = screen.getByRole("spinbutton", {
      name: "Aantal voor SAPA.RAE.46990.AT",
    });
    expect(aantalInput).toHaveValue(6);

    fireEvent.change(aantalInput, { target: { value: "9" } });
    expect(aantalInput).toHaveValue(9);
  });

  it("allows editing the aantal for min-max-voorraad rows too, defaulting to the bestel-advies", () => {
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
    const aantalInput = screen.getByRole("spinbutton", {
      name: "Aantal voor SAPA.RAE.77777.AT",
    });
    expect(aantalInput).toHaveValue(25);

    fireEvent.change(aantalInput, { target: { value: "30" } });
    expect(aantalInput).toHaveValue(30);
  });

  it("allows editing the leverancier for an order line via a dropdown", async () => {
    const user = userEvent.setup();
    render(<LakproductiePage items={mockItems} />);
    await user.click(
      screen.getByRole("combobox", { name: "Leverancier voor SAPA.RAE.46990.AT" })
    );
    await user.click(await screen.findByRole("option", { name: "Wilms Lakkerij" }));

    expect(
      screen.getByRole("combobox", { name: "Leverancier voor SAPA.RAE.46990.AT" })
    ).toHaveTextContent("Wilms Lakkerij");
  });

  it("shows the klant and other detail fields in a popup when a row is clicked", () => {
    render(<LakproductiePage items={mockItems} />);
    fireEvent.click(screen.getByText("2177435"));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("CONE LIGHTING BV")).toBeInTheDocument();
    expect(within(dialog).getByText("SAPA.RAE.46990.AT")).toBeInTheDocument();
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

  it("subgroups order lines within a kleur group by leverancier", () => {
    render(<LakproductiePage items={mockItems} />);
    // Both distinct leveranciers within the "ANO · TITANIUM" kleur group
    // must appear as their own subgroup heading (each name also shows up
    // again in that row's leverancier dropdown, hence getAllByText).
    expect(screen.getAllByText("ALUCOL BV").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Anogel bvba").length).toBeGreaterThan(0);
    // Both order lines are still individually visible under that one group.
    expect(screen.getByText("2177435")).toBeInTheDocument();
    expect(screen.getByText("2177500")).toBeInTheDocument();
  });

  it("shows the coating supplier (leverancier) for each order line", () => {
    render(<LakproductiePage items={mockItems} />);
    expect(screen.getAllByText("Wilms Lakkerij").length).toBeGreaterThan(0);
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

    // "STOCK" shown in the Order column instead of a bonnr for min-max
    // rows - these have no order, they're plain stock articles.
    expect(screen.getByText("STOCK")).toBeInTheDocument();

    // Bestel-advies value shown instead of a status badge.
    expect(screen.getByText(/Bestel-advies:\s*25/)).toBeInTheDocument();

    // Aantal is still editable for min-max rows, pre-filled with the
    // bestel-advies as a starting suggestion (see the dedicated test for
    // this behaviour).
    expect(
      screen.getByRole("spinbutton", { name: "Aantal voor SAPA.RAE.77777.AT" })
    ).toHaveValue(25);
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

  it("shows a 'Bestelling aanmaken' button per leverancier-subgroep", () => {
    render(<LakproductiePage items={mockItems} />);
    // "ANO · TITANIUM" has 2 leverancier-subgroups (ALUCOL BV, Anogel
    // bvba); "LAK · RAL 9005 · Structuurlak" and the fallback group each
    // have 1 - 4 buttons in total.
    expect(screen.getAllByRole("button", { name: "Bestelling aanmaken" })).toHaveLength(4);
  });

  it("opens the bestelling-preview for the clicked leverancier-subgroep only", async () => {
    const user = userEvent.setup();
    render(<LakproductiePage items={mockItems} />);

    // "Wilms Lakkerij" also shows up as the current value in that row's
    // leverancier <Select>, so pick the subgroup-header occurrence
    // specifically (the one whose closest <tr> holds the "Bestelling
    // aanmaken" button).
    const wilmsRow = screen
      .getAllByText("Wilms Lakkerij")
      .map((el) => el.closest("tr"))
      .find((tr) => tr?.querySelector("button"));
    if (!wilmsRow) throw new Error("Wilms Lakkerij subgroup header row not found");
    await user.click(within(wilmsRow).getByRole("button", { name: "Bestelling aanmaken" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Bestelling aanmaken — Wilms Lakkerij/)).toBeInTheDocument();
    // Only the line(s) from that subgroup show up in the preview.
    expect(within(dialog).getByText("SAPA.RAE.12345.AT")).toBeInTheDocument();
    expect(within(dialog).queryByText("SAPA.RAE.46990.AT")).not.toBeInTheDocument();
  });

  it("hides slow-moving min-max-voorraad rows (verkoop6Maand < voorraad) when the toggle is clicked", async () => {
    const user = userEvent.setup();
    const traagItem: LakproductieItem = {
      ...baseFields,
      bron: "min-max-voorraad",
      bonnr: null,
      klant: null,
      artnr: "SAPA.RAE.66666.AT",
      omschrijving: "Traag min-max voorraaditem",
      aantal: null,
      behandeling: "MINMAX.9010",
      techniek: "LAK",
      kleursoort: "RAL",
      kleurkode: "9010",
      afwerking: "",
      groepeerKleur: "LAK · RAL 9010",
      orderDatum: null,
      deadline: null,
      lakNaam: "Wilms Lakkerij",
      status: null,
      bestelAdvies: 25,
      // baseFields.voorraad (100) > baseFields.verkoop6Maand (3), so this
      // item is a "trage" min-max article.
    };
    const snelItem: LakproductieItem = {
      ...traagItem,
      artnr: "SAPA.RAE.55556.AT",
      omschrijving: "Snel min-max voorraaditem",
      verkoop6Maand: 500,
    };
    render(<LakproductiePage items={[traagItem, snelItem]} />);

    expect(screen.getByText("SAPA.RAE.66666.AT")).toBeInTheDocument();
    expect(screen.getByText("SAPA.RAE.55556.AT")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Verberg trage min-max artikelen" }));

    expect(screen.queryByText("SAPA.RAE.66666.AT")).not.toBeInTheDocument();
    expect(screen.getByText("SAPA.RAE.55556.AT")).toBeInTheDocument();

    // Toggling back shows it again.
    await user.click(screen.getByRole("button", { name: "Toon trage min-max artikelen" }));
    expect(screen.getByText("SAPA.RAE.66666.AT")).toBeInTheDocument();
  });

  it("also hides a min-max-voorraad row with verkoop6Maand 0, even when voorraad is 0 too", async () => {
    const user = userEvent.setup();
    const geenVerkoopItem: LakproductieItem = {
      ...baseFields,
      bron: "min-max-voorraad",
      bonnr: null,
      klant: null,
      artnr: "SAPA.RAE.77778.AT",
      omschrijving: "Min-max voorraaditem zonder verkoop",
      aantal: null,
      behandeling: "MINMAX.9011",
      techniek: "LAK",
      kleursoort: "RAL",
      kleurkode: "9011",
      afwerking: "",
      groepeerKleur: "LAK · RAL 9011",
      orderDatum: null,
      deadline: null,
      lakNaam: "Wilms Lakkerij",
      status: null,
      bestelAdvies: 25,
      voorraad: 0,
      verkoop6Maand: 0,
    };
    render(<LakproductiePage items={[geenVerkoopItem]} />);
    expect(screen.getByText("SAPA.RAE.77778.AT")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Verberg trage min-max artikelen" }));
    expect(screen.queryByText("SAPA.RAE.77778.AT")).not.toBeInTheDocument();
  });

  it("filters order lines by kleur/techniek combinatie", async () => {
    const user = userEvent.setup();
    render(<LakproductiePage items={mockItems} />);
    await user.click(screen.getByRole("combobox", { name: "Kleur/techniek" }));
    await user.click(await screen.findByRole("option", { name: "LAK · RAL 9005 · Structuurlak" }));

    expect(screen.getByText("2177999")).toBeInTheDocument();
    expect(screen.queryByText("2177435")).not.toBeInTheDocument();
    expect(screen.queryByText("2177500")).not.toBeInTheDocument();
    expect(screen.queryByText("2178050")).not.toBeInTheDocument();
  });

  it("lists distinct kleur/techniek combinaties (groepeerKleur, falling back to behandeling) as filter options", async () => {
    const user = userEvent.setup();
    render(<LakproductiePage items={mockItems} />);
    await user.click(screen.getByRole("combobox", { name: "Kleur/techniek" }));

    expect(await screen.findByRole("option", { name: "Alle kleur/techniek combinaties" })).toBeInTheDocument();
    // "ANO · TITANIUM" appears once even though two order lines share it.
    expect(screen.getAllByRole("option", { name: "ANO · TITANIUM" })).toHaveLength(1);
    expect(screen.getByRole("option", { name: "LAK · RAL 9005 · Structuurlak" })).toBeInTheDocument();
    // Fallback to the raw behandeling code when nothing could be derived.
    expect(screen.getByRole("option", { name: "WIL.101270.9016.COATEX" })).toBeInTheDocument();
  });

  it("defaults to showing all kleur/techniek combinaties", async () => {
    const user = userEvent.setup();
    render(<LakproductiePage items={mockItems} />);
    // No kleur/techniek filter applied yet, so every order line is shown.
    for (const item of mockItems) {
      expect(screen.getByText(String(item.bonnr))).toBeInTheDocument();
    }
    await user.click(screen.getByRole("combobox", { name: "Kleur/techniek" }));
    expect(
      await screen.findByRole("option", { name: "Alle kleur/techniek combinaties" })
    ).toHaveAttribute("aria-selected", "true");
  });

  it("disables the button for the 'Geen leverancier' subgroup", () => {
    const noSupplierItem: LakproductieItem = {
      ...baseFields,
      bron: "min-max-voorraad",
      bonnr: null,
      klant: null,
      artnr: "SAPA.RAE.00001.AT",
      omschrijving: "Item zonder gekende lak-leverancier",
      aantal: null,
      behandeling: "MINMAX.0001",
      techniek: "",
      kleursoort: "",
      kleurkode: "",
      afwerking: "",
      groepeerKleur: "MINMAX.0001",
      orderDatum: null,
      deadline: null,
      lakNaam: "",
      status: null,
      bestelAdvies: 5,
    };
    render(<LakproductiePage items={[noSupplierItem]} />);
    expect(screen.getByRole("button", { name: "Bestelling aanmaken" })).toBeDisabled();
  });
});
