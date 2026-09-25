import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArtikelScanView } from "../artikel-scan-view";
import { getArtikelScan } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({ getArtikelScan: vi.fn() }));

const mockedGetArtikelScan = vi.mocked(getArtikelScan);

async function scan(value: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Artikel scannen"), value + "{Enter}");
}

describe("ArtikelScanView", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("shows the resolved article on a successful scan", async () => {
    mockedGetArtikelScan.mockResolvedValue({
      status: "resolved",
      scan: "590123",
      article: {
        artnr: "ART-1",
        nummer: 1,
        xref: "XREF-1",
        omschrijving: "Profiel",
        barcode: "590123",
        pickingkode: "P1",
        pickingkleur: "Rood",
      },
      empty: false,
    });
    render(<ArtikelScanView />);

    await scan("590123");

    await waitFor(() => expect(screen.getByText("ART-1")).toBeInTheDocument());
    expect(mockedGetArtikelScan).toHaveBeenCalledWith("590123");
  });

  it("shows the not-found state when status is not_found", async () => {
    mockedGetArtikelScan.mockResolvedValue({
      status: "not_found",
      scan: "garbage",
      article: null,
      empty: true,
    });
    render(<ArtikelScanView />);

    await scan("garbage");

    await waitFor(() => expect(screen.getByText("Artikel niet gevonden")).toBeInTheDocument());
  });

  it("shows the multiple-found state when status is multiple", async () => {
    mockedGetArtikelScan.mockResolvedValue({
      status: "multiple",
      scan: "AMBIGUOUS",
      article: null,
      empty: true,
      candidates: [
        { artnr: "ART-1", omschrijving: "Profiel A" },
        { artnr: "ART-2", omschrijving: "Profiel B" },
      ],
    });
    render(<ArtikelScanView />);

    await scan("AMBIGUOUS");

    await waitFor(() =>
      expect(screen.getByText(/Meerdere artikelen gevonden voor deze scan/)).toBeInTheDocument()
    );
    // Candidates list is intentionally not rendered.
    expect(screen.queryByText("Profiel A")).not.toBeInTheDocument();
  });

  it("shows the backend's error message as-is on a failed scan", async () => {
    mockedGetArtikelScan.mockRejectedValue(new Error("Ontbrekende parameter 'scan'"));
    render(<ArtikelScanView />);

    await scan("");

    // Empty submits are ignored client-side, so trigger via a non-empty
    // scan that the mocked API call rejects.
    await scan("x");

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Ontbrekende parameter 'scan'")
    );
  });

  it("supports in-place re-scan: a second scan replaces the first result without unmounting", async () => {
    mockedGetArtikelScan.mockResolvedValueOnce({
      status: "resolved",
      scan: "1",
      article: {
        artnr: "ART-1",
        nummer: 1,
        xref: "XREF-1",
        omschrijving: "Profiel A",
        barcode: "1",
        pickingkode: "P1",
        pickingkleur: "Rood",
      },
      empty: false,
    });
    render(<ArtikelScanView />);

    await scan("1");
    await waitFor(() => expect(screen.getByText("ART-1")).toBeInTheDocument());

    mockedGetArtikelScan.mockResolvedValueOnce({
      status: "resolved",
      scan: "2",
      article: {
        artnr: "ART-2",
        nummer: 2,
        xref: "XREF-2",
        omschrijving: "Profiel B",
        barcode: "2",
        pickingkode: "P2",
        pickingkleur: "Blauw",
      },
      empty: false,
    });

    await scan("2");

    await waitFor(() => expect(screen.getByText("ART-2")).toBeInTheDocument());
    expect(screen.queryByText("ART-1")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Artikel scannen")).toBeInTheDocument();
  });
});
