import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderCreatePage } from "../order-create-page";
import type { KlantItem } from "@/lib/api-client";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const createBonMock = vi.fn();
const createBonLijnMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    createBon: (...args: unknown[]) => createBonMock(...args),
    createBonLijn: (...args: unknown[]) => createBonLijnMock(...args),
  };
});

const mockKlant: KlantItem = {
  klnr: 14644,
  naam: "CONE LIGHTING BV",
  naam1: "",
  contact: "Jan Janssens",
  adres: "Catershoflaan 70-76",
  postnr: "2170",
  stad: "Merksem",
  land: "BE",
  tel: "",
  fax: "",
  gsm: "",
  email: "",
  taal: "N",
  munt: "EUR",
  btwNr: "",
  saldo: 0,
  geblokkeerd: false,
  opm: "",
};

beforeEach(() => {
  pushMock.mockReset();
  createBonMock.mockReset();
  createBonLijnMock.mockReset();
  sessionStorage.clear();
});

describe("OrderCreatePage", () => {
  it("renders the heading and prefills naam/adres/postnr/stad/munt from the klant", () => {
    render(<OrderCreatePage klant={mockKlant} />);
    expect(screen.getByRole("heading", { name: "Nieuwe order" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Naam" })).toHaveValue("CONE LIGHTING BV");
    expect(screen.getByRole("textbox", { name: "Adres" })).toHaveValue("Catershoflaan 70-76");
    expect(screen.getByRole("textbox", { name: "Stad" })).toHaveValue("Merksem");
    expect(screen.getByText("14644")).toBeInTheDocument();
  });

  it("does not render an editable 'type' header field - it is hardcoded to ORDERBEVESTIGING", () => {
    render(<OrderCreatePage klant={mockKlant} />);
    // Exact match: rules out matching the unrelated "Type nieuwe lijn" select
    // and the lijnen-table "Type" column header further down the page.
    expect(screen.queryByLabelText("Type", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("ORDERBEVESTIGING")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /^type$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /^type$/i })).not.toBeInTheDocument();
  });

  it("rejects a missing datum without calling the API", async () => {
    const user = userEvent.setup();
    render(<OrderCreatePage klant={mockKlant} />);

    const datumInput = screen.getByLabelText("Datum") as HTMLInputElement;
    await user.clear(datumInput);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Datum is verplicht.")).toBeInTheDocument();
    expect(createBonMock).not.toHaveBeenCalled();
  });

  it("creates the order and navigates to its detail page on success with no lines", async () => {
    const user = userEvent.setup();
    createBonMock.mockResolvedValue({ bonnr: 999, klnr: 14644, type: "ORDERBEVESTIGING" });

    render(<OrderCreatePage klant={mockKlant} />);
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createBonMock).toHaveBeenCalledTimes(1));
    expect(createBonMock).toHaveBeenCalledWith(
      expect.objectContaining({ klnr: 14644, naam: "CONE LIGHTING BV", type: "ORDERBEVESTIGING" })
    );
    expect(createBonLijnMock).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/orders/999");
  });

  it("creates bonlijnen sequentially after the bon and navigates to the detail page", async () => {
    const user = userEvent.setup();
    createBonMock.mockResolvedValue({ bonnr: 999, klnr: 14644, type: "ORDERBEVESTIGING" });
    createBonLijnMock.mockResolvedValue({ bonnr: 999, lijnnr: 10 });

    render(<OrderCreatePage klant={mockKlant} />);

    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "ABC");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createBonLijnMock).toHaveBeenCalledTimes(1));
    expect(createBonLijnMock).toHaveBeenCalledWith(999, expect.objectContaining({ artnr: "ABC" }));
    expect(pushMock).toHaveBeenCalledWith("/orders/999");
  });

  it("redirects with lijnFout=1 and stashes the failures in sessionStorage when a line fails", async () => {
    const user = userEvent.setup();
    createBonMock.mockResolvedValue({ bonnr: 999, klnr: 14644, type: "ORDERBEVESTIGING" });
    createBonLijnMock.mockRejectedValue(new Error("400 Bad Request"));

    render(<OrderCreatePage klant={mockKlant} />);

    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "ABC");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/orders/999?lijnFout=1"));
    const stored = sessionStorage.getItem("luna:bon-lijn-fout:999");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.failed[0].error).toBe("400 Bad Request");
  });

  it("computes bedrag excluding subtotaal/kolomtitel/infolijn lines and sends it on the bon payload", async () => {
    const user = userEvent.setup();
    createBonMock.mockResolvedValue({ bonnr: 999, klnr: 14644, type: "ORDERBEVESTIGING" });
    createBonLijnMock.mockResolvedValue({ bonnr: 999, lijnnr: 10 });

    render(<OrderCreatePage klant={mockKlant} />);

    // Artikellijn met bedrag 50 - telt mee.
    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "ART1");
    await user.clear(screen.getByRole("spinbutton", { name: "Bedrag nieuwe lijn" }));
    await user.type(screen.getByRole("spinbutton", { name: "Bedrag nieuwe lijn" }), "50");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    // Subtotaallijn - moet uitgesloten worden ondanks een (hypothetisch) bedrag-veld.
    await user.selectOptions(screen.getByRole("combobox", { name: "Type nieuwe lijn" }), "subtotaal");
    await user.type(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" }), "Subtotaal");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    // Kolomtitellijn - moet uitgesloten worden.
    await user.selectOptions(screen.getByRole("combobox", { name: "Type nieuwe lijn" }), "kolomtitel");
    await user.type(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" }), "Kolomtitel");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    // Infolijn - moet uitgesloten worden.
    await user.selectOptions(screen.getByRole("combobox", { name: "Type nieuwe lijn" }), "infolijn");
    await user.type(screen.getByRole("textbox", { name: "Omschrijving nieuwe lijn" }), "Info");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    // Tweede artikellijn met bedrag 25 - telt mee (totaal moet 75 worden, niet meer).
    await user.type(screen.getByRole("textbox", { name: "Artnr nieuwe lijn" }), "ART2");
    await user.clear(screen.getByRole("spinbutton", { name: "Bedrag nieuwe lijn" }));
    await user.type(screen.getByRole("spinbutton", { name: "Bedrag nieuwe lijn" }), "25");
    await user.click(screen.getByRole("button", { name: /lijn toevoegen/i }));

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createBonMock).toHaveBeenCalledTimes(1));
    expect(createBonMock).toHaveBeenCalledWith(expect.objectContaining({ bedrag: 75 }));
    // Alle 5 lijnen (2 artikel + subtotaal + kolomtitel + infolijn) worden nog steeds als bonlijn aangemaakt.
    expect(createBonLijnMock).toHaveBeenCalledTimes(5);
  });

  it("shows an error and does not navigate when the header create call fails", async () => {
    const user = userEvent.setup();
    createBonMock.mockRejectedValue(new Error("klnr is verplicht"));

    render(<OrderCreatePage klant={mockKlant} />);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("klnr is verplicht")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates back to the klant detail page on cancel", async () => {
    const user = userEvent.setup();
    render(<OrderCreatePage klant={mockKlant} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(pushMock).toHaveBeenCalledWith("/klanten/14644");
  });
});
