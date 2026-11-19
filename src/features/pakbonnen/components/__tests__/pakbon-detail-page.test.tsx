import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PakbonItem, PaklijnItem } from "@/lib/api-client";
import { PakbonDetailPage } from "../pakbon-detail-page";

const mocks = vi.hoisted(() => ({ get: vi.fn(), lines: vi.fn(), update: vi.fn(), remove: vi.fn(), save: vi.fn(), table: vi.fn(), collect: vi.fn(), deleteLine: vi.fn(), updateLine: vi.fn(), createLine: vi.fn(), text: vi.fn(), pages: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api-client", async (original) => ({ ...await original<object>(), getPakbon: mocks.get, getPaklijnen: mocks.lines, updatePakbon: mocks.update, deletePakbon: mocks.remove, afhalenPakbon: mocks.collect, deletePaklijn: mocks.deleteLine, updatePaklijn: mocks.updateLine, createPaklijn: mocks.createLine }));
vi.mock("jspdf", () => ({ jsPDF: class {
  lastAutoTable = { finalY: 90 };
  setFont = vi.fn(); setFontSize = vi.fn(); setTextColor = vi.fn(); setFillColor = vi.fn(); rect = vi.fn(); text = mocks.text; line = vi.fn();
  getTextWidth = () => 10; splitTextToSize = (text: string) => [text]; getNumberOfPages = mocks.pages; setPage = vi.fn(); addPage = vi.fn(); save = mocks.save;
} }));
vi.mock("jspdf-autotable", () => ({ default: mocks.table }));

const kop = { paknr: 500, naam: "Klant", naam1: "", adres: "Straat", postnr: "9000", stad: "Gent", lnaam: "", ladres: "", lpostnr: "", lstad: "", klnr: 1, datum: "2026-09-18", afgehaald: false, facnr: 0, uRef: "Oud", opm: "", verzending: "", tracknr: "", afgehaaldId: "", afgehaaldDatum: null, nBedrag: 0, totBtw: 0, projectnr: 0 } as PakbonItem;
const line = { paknr: 500, lijnnr: 1, bonnr: 42, artnr: "K00", omschr: "Sectie groen", aantal: 0, teLeveren: 0, afgehaald: 0, groepnr: 1, subgroepnr: 1, vprijs: 0, aprijs: 0, korting: 0, bedrag: 0, klnr: 1, blijnnr: 1 } as PaklijnItem;
function show(values: Partial<PakbonItem> = {}) { render(<PakbonDetailPage pakbon={{ ...kop, ...values }} paklijnen={[line]} />); }

beforeEach(() => {
  vi.resetAllMocks();
  mocks.pages.mockReturnValue(1);
  mocks.get.mockResolvedValue(kop); mocks.lines.mockResolvedValue([line]); mocks.update.mockResolvedValue(kop);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("PakbonDetailPage", () => {
  it.each([{ afgehaald: true, afgehaaldId: "Jan", afgehaaldDatum: "2026-09-18" }, { facnr: 88 }])("locks all mutations but retains printing: %j", (values) => {
    show(values);
    for (const name of ["Bewerken", "Verwijderen", "Afhalen", "Paklijn toevoegen", "Verwijder paklijn 1"]) expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("niet meer bewerkbaar");
    expect(screen.getByRole("button", { name: "Afdrukken" })).toBeEnabled();
    fireEvent.click(screen.getByText("Sectie groen"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("renders K00 in a green full-width editable row", async () => {
    show();
    expect(screen.getByText("Sectie groen").closest("td")).toHaveAttribute("colspan", "8");
    expect(screen.getByText("Sectie groen").closest("td")).toHaveClass("text-primary-600");
    await userEvent.click(screen.getByText("Sectie groen"));
    expect(screen.getByRole("dialog")).toHaveTextContent("Paklijn bewerken");
  });
  it("saves only changed header fields", async () => {
    show(); await userEvent.click(screen.getByRole("button", { name: "Bewerken" }));
    const field = screen.getByLabelText("Uw referentie");
    fireEvent.change(field, { target: { value: "Nieuw" } });
    mocks.update.mockResolvedValue({ ...kop, uRef: "Nieuw" });
    await userEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(500, { uRef: "Nieuw" }));
    expect(await screen.findByText("Nieuw")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("shows backend errors and guards dirty header dismissal", async () => {
    show(); await userEvent.click(screen.getByRole("button", { name: "Bewerken" }));
    fireEvent.change(screen.getByLabelText("Levernaam"), { target: { value: "Werf" } });
    mocks.update.mockRejectedValue(new Error("Niet toegestaan"));
    await userEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Niet toegestaan");
    vi.mocked(window.confirm).mockReturnValue(false);
    await userEvent.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("reloads both header and lines, including the missing state", async () => {
    show(); mocks.get.mockResolvedValue({ ...kop, uRef: "Herlezen" }); mocks.lines.mockResolvedValue([]);
    await userEvent.click(screen.getByRole("button", { name: "Vernieuwen" }));
    expect(await screen.findByText("Herlezen")).toBeInTheDocument();
    expect(screen.getByText("Geen paklijnen gevonden voor deze pakbon.")).toBeInTheDocument();
    expect(mocks.lines).toHaveBeenCalledWith(500);
    mocks.get.mockResolvedValue(null);
    await userEvent.click(screen.getByRole("button", { name: "Vernieuwen" }));
    expect(await screen.findByText("Pakbon niet gevonden")).toBeInTheDocument();
  });
  it("keeps data on reload failure", async () => {
    show(); mocks.get.mockRejectedValue(new Error("Offline"));
    await userEvent.click(screen.getByRole("button", { name: "Vernieuwen" }));
    expect(await screen.findByText("Offline")).toBeInTheDocument();
    expect(screen.getByText("Sectie groen")).toBeInTheDocument();
  });
  it("downloads a price-free PDF and marks it printed", async () => {
    show(); await userEvent.click(screen.getByRole("button", { name: "Afdrukken" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith("pakbon-500.pdf"));
    expect(mocks.update).toHaveBeenCalledWith(500, { afgedrukt: true });
    expect(mocks.table.mock.calls[1][1].head).toEqual([["Artikelnr", "Omschrijving", "Aantal"]]);
    expect(screen.getByText("Afgedrukt").parentElement).toHaveTextContent("Ja");
    expect(mocks.text.mock.calls.filter(([text]) => text === "Verzendnota 500")).toHaveLength(1);
    expect(mocks.text).toHaveBeenCalledWith("*500*", 170, 29, { align: "center" });
    expect(mocks.text).toHaveBeenCalledWith("Totaal aantal items : 0", 15, 104);
  });
  it("draws one header per page and explicitly styles text rows", async () => {
    show();
    mocks.pages.mockReturnValue(2);
    mocks.lines.mockResolvedValue([
      line,
      { ...line, lijnnr: 2, artnr: "", infolijn: true },
      { ...line, lijnnr: 3, artnr: "", kolomtitel: true },
      { ...line, lijnnr: 4, artnr: "LED", aantal: 1.5 },
    ]);
    await userEvent.click(screen.getByRole("button", { name: "Vernieuwen" }));
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(5));
    await userEvent.click(screen.getByRole("button", { name: "Afdrukken" }));
    expect(mocks.text.mock.calls.filter(([text]) => text === "Verzendnota 500")).toHaveLength(2);
    expect(mocks.text).toHaveBeenCalledWith("Blz. : 1/2", 195, 287, { align: "right" });
    expect(mocks.text).toHaveBeenCalledWith("Blz. : 2/2", 195, 287, { align: "right" });
    expect(mocks.text).toHaveBeenCalledWith("Totaal aantal items : 1", 15, 104);
    const body = mocks.table.mock.calls[1][1].body;
    expect(body[0][0].styles).toEqual({ fontStyle: "bold" });
    expect(body[1][0].styles).toEqual({ fontStyle: "bold", textColor: [96, 161, 114] });
    expect(body[2][0].styles).toEqual({ fontStyle: "italic" });
    expect(body[3][0].styles).toEqual({ fontStyle: "italic" });
    expect(body[4]).toEqual(["LED", "Sectie groen", "1,5"]);
  });
  it("keeps the download on print-status failure and does not remark printed documents", async () => {
    show(); mocks.update.mockRejectedValue(new Error("Status geweigerd"));
    await userEvent.click(screen.getByRole("button", { name: "Afdrukken" }));
    expect(await screen.findByText(/PDF aangemaakt, maar/)).toHaveTextContent("Status geweigerd");
    expect(mocks.save).toHaveBeenCalled();
  });
  it("does not update an already printed document", async () => {
    show({ afgedrukt: true }); await userEvent.click(screen.getByRole("button", { name: "Afdrukken" }));
    expect(mocks.save).toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it("reports PDF generation errors without marking printed", async () => {
    show(); mocks.save.mockImplementation(() => { throw new Error("PDF fout"); });
    await userEvent.click(screen.getByRole("button", { name: "Afdrukken" }));
    expect(await screen.findByText("PDF fout")).toBeInTheDocument(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it("reloads header and lines after deleting a line", async () => {
    show(); await userEvent.click(screen.getByRole("button", { name: "Verwijder paklijn 1" }));
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith(500));
    expect(mocks.lines).toHaveBeenCalledWith(500);
  });
  it.each([true, false])("reloads after saving a line (new: %s)", async (isNew) => {
    show();
    mocks.createLine.mockResolvedValue({ ...line, lijnnr: 2 }); mocks.updateLine.mockResolvedValue(line);
    if (isNew) await userEvent.click(screen.getByRole("button", { name: "Paklijn toevoegen" }));
    else await userEvent.click(screen.getByText("Sectie groen"));
    await userEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith(500));
    expect(mocks.lines).toHaveBeenCalledWith(500);
  });
  it("reloads after collection and locks the page", async () => {
    const collected = { ...kop, afgehaald: true, afgehaaldId: "Jan", afgehaaldDatum: "2026-09-18" };
    mocks.collect.mockResolvedValue(collected); mocks.get.mockResolvedValue(collected);
    show(); await userEvent.click(screen.getByRole("button", { name: "Afhalen" }));
    await userEvent.type(screen.getByLabelText("Identificatie"), "Jan");
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Afhalen bevestigen" }));
    await waitFor(() => expect(mocks.lines).toHaveBeenCalledWith(500));
    expect(screen.getByRole("status")).toHaveTextContent("Jan");
  });
});
