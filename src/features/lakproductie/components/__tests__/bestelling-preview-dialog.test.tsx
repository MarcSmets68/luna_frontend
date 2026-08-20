import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BestellingPreviewDialog } from "../bestelling-preview-dialog";
import type { LakproductieItem } from "@/lib/api-client";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const createLakproductieBestellingMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createLakproductieBestelling: (...args: unknown[]) =>
      createLakproductieBestellingMock(...args),
  };
});

const baseFields: Omit<
  LakproductieItem,
  | "bron"
  | "bonnr"
  | "klant"
  | "artnr"
  | "omschrijving"
  | "aantal"
  | "lijnnr"
  | "prodLijnnr"
  | "lijnBesteld"
  | "bestelAdvies"
> = {
  behandeling: "",
  techniek: "",
  kleursoort: "",
  kleurkode: "",
  afwerking: "",
  groepeerKleur: "",
  ledAlu: "",
  ledType: "",
  ledKenmerk: "",
  typeAfwerking: "",
  lakLevnr: 623,
  lakNaam: "ALUCOL BV",
  voorraad: 0,
  gereserveerdVoorraad: 0,
  extVoorraad: 0,
  extGereserveerd: 0,
  voorbewerkingNodig: false,
  verpakking: 12,
  premontageDatum: null,
  verkoop1Maand: 0,
  verkoop3Maand: 0,
  verkoop6Maand: 0,
  verkoop9Maand: 0,
  verkoop12Maand: 0,
  groepnr: null,
  subgroepnr: null,
  lijnGereserveerd: null,
  status: null,
  deadline: null,
  ordnr: null,
  orderLevnr: null,
  orderNaam: null,
  orderDatum: null,
  maatBevestigd: null,
  kleurOnbepaald: false,
};

const orderLine: LakproductieItem = {
  ...baseFields,
  bron: "lopende-orders",
  bonnr: 2177435,
  klant: "CONE LIGHTING BV",
  artnr: "SAPA.RAE.46990.AT",
  omschrijving: "1D LED profiel",
  aantal: 10,
  lijnnr: 1,
  prodLijnnr: null,
  lijnBesteld: 4,
  bestelAdvies: null,
};

const productielijnLine: LakproductieItem = {
  ...baseFields,
  bron: "lopende-productielijnen",
  bonnr: 2177500,
  klant: "SUBGROUP CLIENT BV",
  artnr: "SAPA.RAE.47000.AT",
  omschrijving: "1D LED profiel productielijn",
  aantal: 5,
  lijnnr: 2,
  prodLijnnr: 7,
  lijnBesteld: 0,
  bestelAdvies: null,
};

const minMaxLine: LakproductieItem = {
  ...baseFields,
  bron: "min-max-voorraad",
  bonnr: null,
  klant: null,
  artnr: "SAPA.RAE.99999.AT",
  omschrijving: "Min-max voorraaditem",
  aantal: null,
  lijnnr: null,
  prodLijnnr: null,
  lijnBesteld: null,
  bestelAdvies: 25,
};

beforeEach(() => {
  createLakproductieBestellingMock.mockReset();
  refreshMock.mockReset();
});

describe("BestellingPreviewDialog", () => {
  it("does not render dialog content when items is null", () => {
    render(
      <BestellingPreviewDialog leverancier="" levnr={null} items={null} onOpenChange={() => {}} />
    );
    expect(screen.queryByText(/Bestelling aanmaken/)).not.toBeInTheDocument();
  });

  it("defaults aantal to the outstanding balance (aantal - lijnBesteld)", () => {
    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[orderLine]}
        onOpenChange={() => {}}
      />
    );
    const input = screen.getByRole("spinbutton", { name: "Aantal voor SAPA.RAE.46990.AT" });
    expect(input).toHaveValue(6);
  });

  it("defaults aantal to bestelAdvies for min-max-voorraad lines", () => {
    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[minMaxLine]}
        onOpenChange={() => {}}
      />
    );
    const input = screen.getByRole("spinbutton", { name: "Aantal voor SAPA.RAE.99999.AT" });
    expect(input).toHaveValue(25);
  });

  // Regressietest voor de bug waarbij een gewijzigd Aantal op de
  // Lakproduktie-pagina genegeerd werd voor min-max-voorraad-regels: de
  // pagina past een lokale override toe via item.aantal (zie
  // applyOverride() in lakproductie-page.tsx), zelfs voor deze bron waar
  // aantal normaal null is - de preview moet die overridden waarde
  // gebruiken in plaats van het oorspronkelijke bestelAdvies.
  it("prefers an overridden aantal over bestelAdvies for min-max-voorraad lines", () => {
    const overriddenMinMaxLine: LakproductieItem = { ...minMaxLine, aantal: 40 };
    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[overriddenMinMaxLine]}
        onOpenChange={() => {}}
      />
    );
    const input = screen.getByRole("spinbutton", { name: "Aantal voor SAPA.RAE.99999.AT" });
    expect(input).toHaveValue(40);
  });

  it("calls onOpenChange(false) on cancel without calling the API", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[orderLine]}
        onOpenChange={onOpenChange}
      />
    );
    await user.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(createLakproductieBestellingMock).not.toHaveBeenCalled();
  });

  it("excludes an unchecked line from the created bestelling", async () => {
    const user = userEvent.setup();
    createLakproductieBestellingMock.mockResolvedValue({
      ordnr: 42,
      levnr: 623,
      naam: "ALUCOL BV",
      datum: "2026-08-18",
      munt: "EUR",
      lines: [],
    });

    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[orderLine, productielijnLine]}
        onOpenChange={() => {}}
      />
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Lijn opnemen voor SAPA.RAE.47000.AT" })
    );
    await user.click(screen.getByRole("button", { name: "Bestelling aanmaken" }));

    await waitFor(() => expect(createLakproductieBestellingMock).toHaveBeenCalledTimes(1));
    const payload = createLakproductieBestellingMock.mock.calls[0][0];
    expect(payload.levnr).toBe(623);
    expect(payload.lines).toHaveLength(1);
    expect(payload.lines[0]).toMatchObject({
      artnr: "SAPA.RAE.46990.AT",
      aantal: 6,
      bonnr: 2177435,
      blijnnr: 1,
    });
  });

  it("sends bonnr/blijnnr/volgnr for a lopende-productielijnen line", async () => {
    const user = userEvent.setup();
    createLakproductieBestellingMock.mockResolvedValue({
      ordnr: 42,
      levnr: 623,
      naam: "ALUCOL BV",
      datum: "2026-08-18",
      munt: "EUR",
      lines: [],
    });

    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[productielijnLine]}
        onOpenChange={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Bestelling aanmaken" }));

    await waitFor(() => expect(createLakproductieBestellingMock).toHaveBeenCalledTimes(1));
    const payload = createLakproductieBestellingMock.mock.calls[0][0];
    expect(payload.lines[0]).toMatchObject({
      artnr: "SAPA.RAE.47000.AT",
      aantal: 5,
      bonnr: 2177500,
      blijnnr: 2,
      volgnr: 7,
    });
  });

  it("sends no bonnr/blijnnr/volgnr for a min-max-voorraad line", async () => {
    const user = userEvent.setup();
    createLakproductieBestellingMock.mockResolvedValue({
      ordnr: 42,
      levnr: 623,
      naam: "ALUCOL BV",
      datum: "2026-08-18",
      munt: "EUR",
      lines: [],
    });

    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[minMaxLine]}
        onOpenChange={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Bestelling aanmaken" }));

    await waitFor(() => expect(createLakproductieBestellingMock).toHaveBeenCalledTimes(1));
    const payload = createLakproductieBestellingMock.mock.calls[0][0];
    expect(payload.lines[0].bonnr).toBeUndefined();
    expect(payload.lines[0].blijnnr).toBeUndefined();
    expect(payload.lines[0].volgnr).toBeUndefined();
  });

  it("allows editing the aantal before confirming", async () => {
    createLakproductieBestellingMock.mockResolvedValue({
      ordnr: 42,
      levnr: 623,
      naam: "ALUCOL BV",
      datum: "2026-08-18",
      munt: "EUR",
      lines: [],
    });

    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[orderLine]}
        onOpenChange={() => {}}
      />
    );

    const input = screen.getByRole("spinbutton", { name: "Aantal voor SAPA.RAE.46990.AT" });
    fireEvent.change(input, { target: { value: "9" } });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Bestelling aanmaken" }));

    await waitFor(() => expect(createLakproductieBestellingMock).toHaveBeenCalledTimes(1));
    expect(createLakproductieBestellingMock.mock.calls[0][0].lines[0].aantal).toBe(9);
  });

  it("shows a confirmation with the created ordnr and refreshes the page on success", async () => {
    const user = userEvent.setup();
    createLakproductieBestellingMock.mockResolvedValue({
      ordnr: 555,
      levnr: 623,
      naam: "ALUCOL BV",
      datum: "2026-08-18",
      munt: "EUR",
      lines: [],
    });

    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[orderLine]}
        onOpenChange={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Bestelling aanmaken" }));

    expect(await screen.findByText(/555/)).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows an error and does not close when the API call fails", async () => {
    const user = userEvent.setup();
    createLakproductieBestellingMock.mockRejectedValue(new Error("Leverancier 623 not found"));

    render(
      <BestellingPreviewDialog
        leverancier="ALUCOL BV"
        levnr={623}
        items={[orderLine]}
        onOpenChange={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Bestelling aanmaken" }));

    expect(await screen.findByText("Leverancier 623 not found")).toBeInTheDocument();
  });
});
