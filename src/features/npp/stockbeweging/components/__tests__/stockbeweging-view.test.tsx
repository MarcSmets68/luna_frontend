import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StockbewegingView } from "../stockbeweging-view";
import { getArtikelScan, postStockBeweging } from "@/lib/api-client";
import { saveSession, clearSession } from "@/features/auth/session";

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    getArtikelScan: vi.fn(),
    postStockBeweging: vi.fn(),
  };
});

const mockedGetArtikelScan = vi.mocked(getArtikelScan);
const mockedPostStockBeweging = vi.mocked(postStockBeweging);

const resolvedArticle = {
  artnr: "ART-1",
  nummer: 1,
  xref: "XREF-1",
  omschrijving: "Profiel",
  barcode: "590123",
  pickingkode: "P1",
  pickingkleur: "Rood",
};

async function scanResolved() {
  mockedGetArtikelScan.mockResolvedValue({
    status: "resolved",
    scan: "590123",
    article: resolvedArticle,
    empty: false,
  });
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Artikel scannen"), "590123{Enter}");
  await waitFor(() => expect(screen.getByText("ART-1")).toBeInTheDocument());
  return user;
}

function stubSession() {
  saveSession({
    token: "tok-1",
    kode: "MARC",
    naam: "Marc",
    niveau: 1,
    everyoneAdminActive: false,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
}

describe("StockbewegingView", () => {
  afterEach(() => {
    vi.resetAllMocks();
    clearSession();
  });

  it("shows the not-found state when the scan is not resolved", async () => {
    mockedGetArtikelScan.mockResolvedValue({
      status: "not_found",
      scan: "garbage",
      article: null,
      empty: true,
    });
    render(<StockbewegingView />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Artikel scannen"), "garbage{Enter}");

    await waitFor(() => expect(screen.getByText("Artikel niet gevonden")).toBeInTheDocument());
  });

  it("shows the multiple-found state when the scan is ambiguous", async () => {
    mockedGetArtikelScan.mockResolvedValue({
      status: "multiple",
      scan: "AMBIGUOUS",
      article: null,
      empty: true,
      candidates: [{ artnr: "ART-1", omschrijving: "A" }],
    });
    render(<StockbewegingView />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Artikel scannen"), "AMBIGUOUS{Enter}");

    await waitFor(() =>
      expect(screen.getByText(/Meerdere artikelen gevonden voor deze scan/)).toBeInTheDocument()
    );
  });

  it("shows the movement-type selector and requires a valid form before Doorgaan is enabled", async () => {
    render(<StockbewegingView />);
    const user = await scanResolved();

    expect(screen.getByRole("button", { name: "Doorgaan" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Ontvangst" }));
    expect(screen.getByRole("button", { name: "Doorgaan" })).toBeDisabled();

    await user.type(screen.getByLabelText("Aantal"), "5");
    await user.type(screen.getByLabelText("Opmerking"), "Ontvangst levering");

    expect(screen.getByRole("button", { name: "Doorgaan" })).toBeEnabled();
  });

  it("hides Aantal, shows Nieuw magazijn and hides the editable opmerking for transfer_intern", async () => {
    render(<StockbewegingView />);
    const user = await scanResolved();

    await user.click(screen.getByRole("button", { name: "Transfer intern" }));

    expect(screen.queryByLabelText("Aantal")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Opmerking")).not.toBeInTheDocument();
    expect(screen.getByText("Opmerking wordt automatisch ingevuld")).toBeInTheDocument();
    expect(screen.getByLabelText("Nieuw magazijn")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Doorgaan" })).toBeDisabled();
    await user.type(screen.getByLabelText("Nieuw magazijn"), "M2");
    expect(screen.getByRole("button", { name: "Doorgaan" })).toBeEnabled();
  });

  it("requires the mandatory confirm dialog before booking, and books on confirm", async () => {
    stubSession();
    const bookingResult = {
      artikel: { artnr: "ART-1", voorraad: 42, magazijn: "M1" },
      artlog: {
        artnr: "ART-1",
        lijnnr: 1,
        datum: "2026-01-01",
        uur: "10:00",
        beweging: "ontvangst",
        aantal: 5,
        stock: 42,
        opm: "Ontvangst levering",
        id: "1",
      },
    };
    mockedPostStockBeweging.mockResolvedValue(bookingResult);

    render(<StockbewegingView />);
    const user = await scanResolved();

    await user.click(screen.getByRole("button", { name: "Ontvangst" }));
    await user.type(screen.getByLabelText("Aantal"), "5");
    await user.type(screen.getByLabelText("Opmerking"), "Ontvangst levering");

    expect(mockedPostStockBeweging).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Doorgaan" }));
    expect(screen.getByText("Boeking bevestigen")).toBeInTheDocument();
    expect(mockedPostStockBeweging).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    await waitFor(() => expect(screen.getByText("Boeking geslaagd")).toBeInTheDocument());
    expect(mockedPostStockBeweging).toHaveBeenCalledTimes(1);
  });

  it("keeps the confirm dialog open with the error shown, and article stays resolved, on a failed booking", async () => {
    stubSession();
    mockedPostStockBeweging.mockRejectedValue(
      new Error("Onvoldoende voorraad voor deze boeking (huidige voorraad: 3)")
    );

    render(<StockbewegingView />);
    const user = await scanResolved();

    await user.click(screen.getByRole("button", { name: "Correctie -" }));
    await user.type(screen.getByLabelText("Aantal"), "10");
    await user.type(screen.getByLabelText("Opmerking"), "Correctie na telling");
    await user.click(screen.getByRole("button", { name: "Doorgaan" }));
    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Onvoldoende voorraad voor deze boeking (huidige voorraad: 3)"
      )
    );
    expect(screen.getByText("Boeking bevestigen")).toBeInTheDocument();
    expect(screen.getAllByText("ART-1").length).toBeGreaterThan(0);
  });

  it("blocks the booking with a clear message when there is no valid session", async () => {
    render(<StockbewegingView />);
    const user = await scanResolved();

    await user.click(screen.getByRole("button", { name: "Ontvangst" }));
    await user.type(screen.getByLabelText("Aantal"), "5");
    await user.type(screen.getByLabelText("Opmerking"), "Ontvangst levering");
    await user.click(screen.getByRole("button", { name: "Doorgaan" }));
    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Je sessie is verlopen of je bent niet ingelogd. Log opnieuw in."
      )
    );
    expect(mockedPostStockBeweging).not.toHaveBeenCalled();
  });

  it("resets back to the artikel step via 'Nieuwe boeking'", async () => {
    stubSession();
    mockedPostStockBeweging.mockResolvedValue({
      artikel: { artnr: "ART-1", voorraad: 42, magazijn: "M1" },
      artlog: {
        artnr: "ART-1",
        lijnnr: 1,
        datum: "2026-01-01",
        uur: "10:00",
        beweging: "ontvangst",
        aantal: 5,
        stock: 42,
        opm: "Ontvangst levering",
        id: "1",
      },
    });

    render(<StockbewegingView />);
    const user = await scanResolved();

    await user.click(screen.getByRole("button", { name: "Ontvangst" }));
    await user.type(screen.getByLabelText("Aantal"), "5");
    await user.type(screen.getByLabelText("Opmerking"), "Ontvangst levering");
    await user.click(screen.getByRole("button", { name: "Doorgaan" }));
    await user.click(screen.getByRole("button", { name: "Bevestigen" }));

    await waitFor(() => expect(screen.getByText("Boeking geslaagd")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Nieuwe boeking" }));

    expect(screen.getByLabelText("Artikel scannen")).toBeInTheDocument();
    expect(screen.queryByText("ART-1")).not.toBeInTheDocument();
  });
});
