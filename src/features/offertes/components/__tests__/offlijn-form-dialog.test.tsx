import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OfflijnFormDialog, computeSubtotaalBedrag, deriveGroepnr } from "../offlijn-form-dialog";
import type { OfflijnItem } from "@/lib/api-client";

const createOfflijnMock = vi.fn();
const updateOfflijnMock = vi.fn();
const getArtikelMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createOfflijn: (...args: unknown[]) => createOfflijnMock(...args),
    updateOfflijn: (...args: unknown[]) => updateOfflijnMock(...args),
    getArtikel: (...args: unknown[]) => getArtikelMock(...args),
  };
});

function makeLine(overrides: Partial<OfflijnItem>): OfflijnItem {
  return {
    offnr: 999999,
    versie: 1,
    lijnnr: 10,
    groepnr: 0,
    subgroepnr: 0,
    artnr: "",
    omschrijving: "",
    omschrijvingOfferte: "",
    aantal: 0,
    teLeveren: 0,
    verkoopprijs: 0,
    brutoVerkoopprijs: 0,
    korting: 0,
    btwKode: "",
    bedrag: 0,
    bruto: 0,
    aankoopprijs: 0,
    opm: "",
    bestellen: false,
    blokkeren: false,
    subtotaal: false,
    kolomtitel: false,
    infolijn: false,
    ...overrides,
  };
}

beforeEach(() => {
  createOfflijnMock.mockReset();
  updateOfflijnMock.mockReset();
  getArtikelMock.mockReset();
});

describe("deriveGroepnr", () => {
  it("returns 0 when there is no preceding kolomtitel", () => {
    const lines = [makeLine({ lijnnr: 10 })];
    expect(deriveGroepnr(lines)).toBe(0);
  });

  it("returns the groepnr of the nearest preceding kolomtitel", () => {
    const lines = [
      makeLine({ lijnnr: 10, kolomtitel: true, groepnr: 1 }),
      makeLine({ lijnnr: 20 }),
      makeLine({ lijnnr: 30, kolomtitel: true, groepnr: 2 }),
      makeLine({ lijnnr: 40 }),
    ];
    expect(deriveGroepnr(lines)).toBe(2);
  });
});

describe("computeSubtotaalBedrag", () => {
  it("sums article lines back to the start of the list", () => {
    const lines = [
      makeLine({ lijnnr: 10, bedrag: 100 }),
      makeLine({ lijnnr: 20, bedrag: 50 }),
    ];
    expect(computeSubtotaalBedrag(lines)).toBe(150);
  });

  it("stops at the previous kolomtitel/subtotaal boundary", () => {
    const lines = [
      makeLine({ lijnnr: 10, bedrag: 999 }),
      makeLine({ lijnnr: 15, kolomtitel: true, omschrijvingOfferte: "Sectie" }),
      makeLine({ lijnnr: 20, bedrag: 50 }),
      makeLine({ lijnnr: 30, bedrag: 25 }),
    ];
    expect(computeSubtotaalBedrag(lines)).toBe(75);
  });

  it("excludes infolijn amounts and skips the line being edited itself", () => {
    const lines = [
      makeLine({ lijnnr: 10, bedrag: 50 }),
      makeLine({ lijnnr: 15, infolijn: true, bedrag: 0 }),
      makeLine({ lijnnr: 20, bedrag: 25 }),
      makeLine({ lijnnr: 30, subtotaal: true, bedrag: 75 }),
    ];
    expect(computeSubtotaalBedrag(lines, 30)).toBe(75);
  });
});

describe("OfflijnFormDialog", () => {
  it("defaults to the Artikel fields in create mode", () => {
    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={null}
        lines={[]}
        onSaved={() => {}}
      />
    );
    expect(screen.getByRole("textbox", { name: "Artnr" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Opzoeken" })).toBeInTheDocument();
  });

  it("switches to the section-title fields when Sectie-titel is selected", async () => {
    const user = userEvent.setup();
    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={null}
        lines={[]}
        onSaved={() => {}}
      />
    );

    await user.click(screen.getByRole("radio", { name: "Sectie-titel" }));

    expect(screen.queryByRole("textbox", { name: "Artnr" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Omschrijving offerte" })).toBeInTheDocument();
  });

  it("switches to the infolijn fields when Infolijn is selected", async () => {
    const user = userEvent.setup();
    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={null}
        lines={[]}
        onSaved={() => {}}
      />
    );

    await user.click(screen.getByRole("radio", { name: "Infolijn" }));

    expect(screen.queryByRole("textbox", { name: "Artnr" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Omschrijving offerte" })).toBeInTheDocument();
  });

  it("switches to the subtotaal fields (with a computed bedrag) when Subtotaal is selected", async () => {
    const user = userEvent.setup();
    const lines = [makeLine({ lijnnr: 10, bedrag: 100 }), makeLine({ lijnnr: 20, bedrag: 50 })];
    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={null}
        lines={lines}
        onSaved={() => {}}
      />
    );

    await user.click(screen.getByRole("radio", { name: "Subtotaal" }));

    expect(screen.getByTestId("subtotaal-bedrag-preview")).toHaveTextContent("150,00");
  });

  it("shows a 0,00 bedrag preview until an artikel has been looked up", () => {
    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={null}
        lines={[]}
        onSaved={() => {}}
      />
    );

    expect(screen.getByTestId("artikel-bedrag-preview")).toHaveTextContent("0,00");
  });

  it("looks up an artikel, prefills omschrijving/verkoopprijs/btwKode and recomputes the bedrag preview (aantal x verkoopprijs - korting%)", async () => {
    const user = userEvent.setup();
    getArtikelMock.mockResolvedValue({
      artnr: "TESTART",
      omschrijvingNl: "Test artikel",
      omschrijvingFr: "",
      merk: "",
      groep: "",
      barcode: "",
      munt: "EUR",
      btwKode: "21",
      aankoopprijs: 10,
      verkoopprijs: 49.95,
      verkoopprijsIncl: 60.44,
      voorraad: 0,
      voorraadMin: 0,
      voorraadMax: 0,
      stock: false,
      geblokkeerd: false,
      leverancierNr: 0,
      gewicht: 0,
      type: "",
      datum: null,
    });

    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={null}
        lines={[]}
        onSaved={() => {}}
      />
    );

    await user.type(screen.getByRole("textbox", { name: "Artnr" }), "TESTART");
    await user.click(screen.getByRole("button", { name: "Opzoeken" }));

    await waitFor(() => expect(getArtikelMock).toHaveBeenCalledWith("TESTART"));
    expect(await screen.findByDisplayValue("Test artikel")).toBeInTheDocument();

    const aantalInput = screen.getByRole("spinbutton", { name: "Aantal" });
    await user.clear(aantalInput);
    await user.type(aantalInput, "2");

    expect(screen.getByTestId("artikel-bedrag-preview")).toHaveTextContent(
      (2 * 49.95).toFixed(2).replace(".", ",")
    );
  });

  it("creates an artikel line with subtotaal/kolomtitel/infolijn all false and no lijnnr", async () => {
    const user = userEvent.setup();
    createOfflijnMock.mockResolvedValue(makeLine({ lijnnr: 10 }));
    const onSaved = vi.fn();

    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={null}
        lines={[]}
        onSaved={onSaved}
      />
    );

    await user.type(screen.getByRole("textbox", { name: "Artnr" }), "TESTART");
    await user.type(screen.getByRole("textbox", { name: "Omschrijving offerte" }), "Test artikel");
    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    await waitFor(() => expect(createOfflijnMock).toHaveBeenCalledTimes(1));
    const [offnr, versie, payload] = createOfflijnMock.mock.calls[0];
    expect(offnr).toBe(999999);
    expect(versie).toBe(1);
    expect(payload).not.toHaveProperty("lijnnr");
    expect(payload).toMatchObject({
      subtotaal: false,
      kolomtitel: false,
      infolijn: false,
      groepnr: 0,
      subgroepnr: 0,
      artnr: "TESTART",
    });
    expect(onSaved).toHaveBeenCalledWith(makeLine({ lijnnr: 10 }));
  });

  it("creates a kolomtitel line with only kolomtitel true", async () => {
    const user = userEvent.setup();
    createOfflijnMock.mockResolvedValue(makeLine({ lijnnr: 10, kolomtitel: true }));

    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={null}
        lines={[]}
        onSaved={() => {}}
      />
    );

    await user.click(screen.getByRole("radio", { name: "Sectie-titel" }));
    await user.type(screen.getByRole("textbox", { name: "Omschrijving offerte" }), "Sectie A");
    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    await waitFor(() => expect(createOfflijnMock).toHaveBeenCalledTimes(1));
    const [, , payload] = createOfflijnMock.mock.calls[0];
    expect(payload).toMatchObject({
      kolomtitel: true,
      subtotaal: false,
      infolijn: false,
      omschrijvingOfferte: "Sectie A",
    });
  });

  it("requires omschrijvingOfferte for a kolomtitel line", async () => {
    const user = userEvent.setup();
    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={null}
        lines={[]}
        onSaved={() => {}}
      />
    );

    await user.click(screen.getByRole("radio", { name: "Sectie-titel" }));
    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    expect(await screen.findByText("Omschrijving offerte is verplicht.")).toBeInTheDocument();
    expect(createOfflijnMock).not.toHaveBeenCalled();
  });

  it("updates an existing line via updateOfflijn (no lijnnr in payload)", async () => {
    const user = userEvent.setup();
    const editingLine = makeLine({
      lijnnr: 20,
      artnr: "EXIST",
      omschrijvingOfferte: "Bestaande lijn",
      aantal: 1,
      verkoopprijs: 10,
    });
    updateOfflijnMock.mockResolvedValue(editingLine);

    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={() => {}}
        editingLine={editingLine}
        lines={[editingLine]}
        onSaved={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Opslaan" }));

    await waitFor(() => expect(updateOfflijnMock).toHaveBeenCalledTimes(1));
    const [offnr, versie, lijnnr, payload] = updateOfflijnMock.mock.calls[0];
    expect(offnr).toBe(999999);
    expect(versie).toBe(1);
    expect(lijnnr).toBe(20);
    expect(payload).not.toHaveProperty("lijnnr");
    expect(payload).not.toHaveProperty("groepnr");
  });

  it("closes without saving on Annuleren", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <OfflijnFormDialog
        offnr={999999}
        versie={1}
        open={true}
        onOpenChange={onOpenChange}
        editingLine={null}
        lines={[]}
        onSaved={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(createOfflijnMock).not.toHaveBeenCalled();
  });
});
