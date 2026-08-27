import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ArtikelDetailPage } from "../artikel-detail-page";
import type { ArtikelItem } from "@/lib/api-client";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const updateArtikelMock = vi.fn();
vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    updateArtikel: (...args: unknown[]) => updateArtikelMock(...args),
  };
});

const mockArtikel: ArtikelItem = {
  artnr: "AB123",
  omschrijvingNl: "Testartikel",
  omschrijvingFr: "Article de test",
  merk: "MERK",
  groep: "GRP1",
  barcode: "1234567890123",
  munt: "EUR",
  btwKode: "1",
  aankoopprijs: 10,
  verkoopprijs: 15.5,
  verkoopprijsIncl: 18.76,
  voorraad: 42,
  voorraadMin: 5,
  voorraadMax: 100,
  stock: true,
  geblokkeerd: false,
  leverancierNr: 1,
  gewicht: 1.2,
  type: "STD",
  datum: "2026-01-01",
  isSamengesteld: false,
};

beforeEach(() => {
  updateArtikelMock.mockReset();
  refreshMock.mockReset();
});

describe("ArtikelDetailPage", () => {
  it("renders the omschrijving as heading and the artnr", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByRole("heading", { name: "Testartikel" })).toBeInTheDocument();
    expect(screen.getByText("Artikelnr AB123")).toBeInTheDocument();
  });

  it("renders artikel detail fields", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByText("MERK")).toBeInTheDocument();
    expect(screen.getByText("1234567890123")).toBeInTheDocument();
    expect(screen.getByText("Article de test")).toBeInTheDocument();
  });

  it("renders the algemeen, prijzen and voorraadinformatie sections", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByText("Algemeen")).toBeInTheDocument();
    expect(screen.getByText("Prijzen")).toBeInTheDocument();
    expect(screen.getByText("Voorraadinformatie")).toBeInTheDocument();
  });

  it("shows a Stock badge when the artikel is in stock and no Geblokkeerd badge when it isn't blocked", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByText("Stock")).toBeInTheDocument();
    expect(screen.queryByText("Geblokkeerd")).not.toBeInTheDocument();
  });

  it("shows a Geblokkeerd badge when the artikel is blocked", () => {
    render(<ArtikelDetailPage artikel={{ ...mockArtikel, geblokkeerd: true }} />);
    expect(screen.getByText("Geblokkeerd")).toBeInTheDocument();
  });

  it("renders a back link to the voorraad overview", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.getByRole("link", { name: /Terug naar overzicht/ })).toHaveAttribute(
      "href",
      "/voorraad"
    );
  });

  it("does not show editable fields until 'Verbeteren' is clicked", () => {
    render(<ArtikelDetailPage artikel={mockArtikel} />);
    expect(screen.queryByRole("textbox", { name: "Merk" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verbeteren" })).toBeInTheDocument();
  });

  it("switches to editable fields after clicking 'Verbeteren', with artnr staying read-only", async () => {
    const user = userEvent.setup();
    render(<ArtikelDetailPage artikel={mockArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    expect(screen.getByRole("textbox", { name: "Merk" })).toHaveValue("MERK");
    expect(screen.getByText("Artikelnr")).toBeInTheDocument();
    expect(screen.getByText("AB123")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Artikelnr" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("reverts changes and does not call the API on cancel", async () => {
    const user = userEvent.setup();
    render(<ArtikelDetailPage artikel={mockArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const merkInput = screen.getByRole("textbox", { name: "Merk" });
    await user.clear(merkInput);
    await user.type(merkInput, "Foutief merk");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(updateArtikelMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "Merk" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Testartikel" })).toBeInTheDocument();
  });

  it("saves the edited fields and refreshes on success", async () => {
    const user = userEvent.setup();
    updateArtikelMock.mockResolvedValue({ ...mockArtikel, merk: "NIEUW MERK" });

    render(<ArtikelDetailPage artikel={mockArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    const merkInput = screen.getByRole("textbox", { name: "Merk" });
    await user.clear(merkInput);
    await user.type(merkInput, "NIEUW MERK");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateArtikelMock).toHaveBeenCalledTimes(1));
    expect(updateArtikelMock).toHaveBeenCalledWith(
      "AB123",
      expect.objectContaining({
        merk: "NIEUW MERK",
        aankoopprijs: 10,
        verkoopprijs: 15.5,
        verkoopprijsIncl: 18.76,
        voorraadMin: 5,
        voorraadMax: 100,
      })
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows an error and does not call the API when a numeric field is invalid", async () => {
    const user = userEvent.setup();
    render(<ArtikelDetailPage artikel={mockArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    const gewichtInput = screen.getByRole("spinbutton", { name: "Gewicht" });
    await user.clear(gewichtInput);
    await user.type(gewichtInput, "-5");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Gewicht moet een geldig getal zijn.")).toBeInTheDocument();
    expect(updateArtikelMock).not.toHaveBeenCalled();
  });

  it("shows an error and stays in edit mode when the API call fails", async () => {
    const user = userEvent.setup();
    updateArtikelMock.mockRejectedValue(new Error("Artikel AB123 not found"));

    render(<ArtikelDetailPage artikel={mockArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Artikel AB123 not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("disables the price fields and omits them from the payload when isSamengesteld is true", async () => {
    const user = userEvent.setup();
    const samengesteldArtikel = { ...mockArtikel, isSamengesteld: true };
    updateArtikelMock.mockResolvedValue(samengesteldArtikel);

    render(<ArtikelDetailPage artikel={samengesteldArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));

    expect(screen.getByRole("spinbutton", { name: "Aankoopprijs" })).toBeDisabled();
    expect(screen.getByRole("spinbutton", { name: "Verkoopprijs" })).toBeDisabled();
    expect(screen.getByRole("spinbutton", { name: "Verkoopprijs incl." })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateArtikelMock).toHaveBeenCalledTimes(1));
    const payload = updateArtikelMock.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("aankoopprijs");
    expect(payload).not.toHaveProperty("verkoopprijs");
    expect(payload).not.toHaveProperty("verkoopprijsIncl");
    // Sharper than the not.toHaveProperty checks above: assert the exact
    // key-set sent to the API, so a future regression that silently
    // re-adds a price key (e.g. as `undefined`, which toHaveProperty
    // would still catch, but let's be explicit) or drops an expected
    // non-price key is caught immediately.
    expect(Object.keys(payload).sort()).toEqual(
      [
        "barcode",
        "btwKode",
        "geblokkeerd",
        "gewicht",
        "groep",
        "leverancierNr",
        "merk",
        "munt",
        "omschrijvingFr",
        "omschrijvingNl",
        "type",
        "voorraadMax",
        "voorraadMin",
      ].sort()
    );
  });

  it("still validates numeric fields (but not the disabled price fields) when isSamengesteld is true", async () => {
    const user = userEvent.setup();
    const samengesteldArtikel = { ...mockArtikel, isSamengesteld: true };

    render(<ArtikelDetailPage artikel={samengesteldArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const gewichtInput = screen.getByRole("spinbutton", { name: "Gewicht" });
    await user.clear(gewichtInput);
    await user.type(gewichtInput, "-1");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Gewicht moet een geldig getal zijn.")).toBeInTheDocument();
    expect(updateArtikelMock).not.toHaveBeenCalled();
  });

  it("rejects a negative aankoopprijs/verkoopprijs when the artikel is not samengesteld", async () => {
    const user = userEvent.setup();
    render(<ArtikelDetailPage artikel={mockArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const aankoopprijsInput = screen.getByRole("spinbutton", { name: "Aankoopprijs" });
    await user.clear(aankoopprijsInput);
    await user.type(aankoopprijsInput, "-10");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Aankoopprijs moet een geldig getal zijn.")).toBeInTheDocument();
    expect(updateArtikelMock).not.toHaveBeenCalled();
  });

  it("rejects voorraadMin greater than voorraadMax", async () => {
    const user = userEvent.setup();
    render(<ArtikelDetailPage artikel={mockArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const voorraadMinInput = screen.getByRole("spinbutton", { name: "Min. voorraad" });
    await user.clear(voorraadMinInput);
    await user.type(voorraadMinInput, "200");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Min. voorraad mag niet groter zijn dan max. voorraad.")
    ).toBeInTheDocument();
    expect(updateArtikelMock).not.toHaveBeenCalled();
  });

  it("rejects an emptied numeric field instead of silently saving it as 0", async () => {
    const user = userEvent.setup();
    updateArtikelMock.mockResolvedValue(mockArtikel);
    render(<ArtikelDetailPage artikel={mockArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const leverancierInput = screen.getByRole("spinbutton", { name: "Leverancier nr" });
    await user.clear(leverancierInput);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Leverancier nr moet een geldig getal zijn.")
    ).toBeInTheDocument();
    expect(updateArtikelMock).not.toHaveBeenCalled();
  });

  it("keeps the entered (unsaved) values visible in the form after a failed save", async () => {
    const user = userEvent.setup();
    updateArtikelMock.mockRejectedValue(new Error("Artikel AB123 not found"));

    render(<ArtikelDetailPage artikel={mockArtikel} />);

    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    const merkInput = screen.getByRole("textbox", { name: "Merk" });
    await user.clear(merkInput);
    await user.type(merkInput, "Nog niet opgeslagen merk");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Artikel AB123 not found")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Merk" })).toHaveValue("Nog niet opgeslagen merk");
  });

  it("never renders an Artikelnr input, even while editing a samengesteld artikel", async () => {
    const user = userEvent.setup();
    const samengesteldArtikel = { ...mockArtikel, isSamengesteld: true };
    render(<ArtikelDetailPage artikel={samengesteldArtikel} />);

    expect(screen.queryByRole("textbox", { name: "Artikelnr" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Verbeteren" }));
    expect(screen.queryByRole("textbox", { name: "Artikelnr" })).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "Artikelnr" })).not.toBeInTheDocument();
  });
});
