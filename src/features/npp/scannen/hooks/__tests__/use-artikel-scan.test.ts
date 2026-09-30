import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useArtikelScan } from "../use-artikel-scan";
import { getArtikelScan, type ArtikelScanResult } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({ getArtikelScan: vi.fn() }));
const mockedGetArtikelScan = vi.mocked(getArtikelScan);

describe("useArtikelScan", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("sets loading while the request is in flight, then result on success", async () => {
    let resolve!: (value: ArtikelScanResult) => void;
    mockedGetArtikelScan.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = renderHook(() => useArtikelScan());

    expect(result.current.result).toBeNull();

    act(() => {
      void result.current.submitScan("590123");
    });
    expect(result.current.loading).toBe(true);

    const data: ArtikelScanResult = {
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
    };
    await act(async () => {
      resolve(data);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.result).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it("sets error and clears result on a failed scan", async () => {
    mockedGetArtikelScan.mockRejectedValue(new Error("Ontbrekende parameter 'scan'"));
    const { result } = renderHook(() => useArtikelScan());

    await act(async () => {
      await result.current.submitScan("");
    });

    expect(result.current.error).toBe("Ontbrekende parameter 'scan'");
    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("replaces the previous result in place on a second submitScan call", async () => {
    mockedGetArtikelScan.mockResolvedValueOnce({
      status: "not_found",
      scan: "999",
      article: null,
      empty: true,
    });
    const { result } = renderHook(() => useArtikelScan());

    await act(async () => {
      await result.current.submitScan("999");
    });
    expect(result.current.result?.status).toBe("not_found");

    mockedGetArtikelScan.mockResolvedValueOnce({
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

    await act(async () => {
      await result.current.submitScan("590123");
    });
    expect(result.current.result?.status).toBe("resolved");
    expect(result.current.result?.article?.artnr).toBe("ART-1");
  });
});
