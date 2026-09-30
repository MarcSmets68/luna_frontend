import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useStockBeweging } from "../use-stock-beweging";
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

describe("useStockBeweging", () => {
  afterEach(() => {
    vi.resetAllMocks();
    clearSession();
  });

  it("resolves the article scan and advances to the form step", async () => {
    mockedGetArtikelScan.mockResolvedValue({
      status: "resolved",
      scan: "590123",
      article: resolvedArticle,
      empty: false,
    });
    const { result } = renderHook(() => useStockBeweging());

    await act(async () => {
      await result.current.submitScan("590123");
    });

    expect(result.current.step).toBe("form");
    expect(result.current.article?.artnr).toBe("ART-1");
  });

  it("stays on the artikel step when the scan is not resolved", async () => {
    mockedGetArtikelScan.mockResolvedValue({
      status: "not_found",
      scan: "garbage",
      article: null,
      empty: true,
    });
    const { result } = renderHook(() => useStockBeweging());

    await act(async () => {
      await result.current.submitScan("garbage");
    });

    expect(result.current.step).toBe("artikel");
    expect(result.current.article).toBeNull();
  });

  it("blocks the booking and shows a clear message when there is no valid session", async () => {
    mockedGetArtikelScan.mockResolvedValue({
      status: "resolved",
      scan: "590123",
      article: resolvedArticle,
      empty: false,
    });
    const { result } = renderHook(() => useStockBeweging());
    await act(async () => {
      await result.current.submitScan("590123");
    });

    act(() => {
      result.current.setMovementType("ontvangst");
    });
    act(() => {
      result.current.setAantal("5");
      result.current.setOpm("Ontvangst levering");
    });
    act(() => {
      result.current.goToConfirm();
    });

    await act(async () => {
      await result.current.confirmBooking();
    });

    expect(result.current.submitError).toBe(
      "Je sessie is verlopen of je bent niet ingelogd. Log opnieuw in."
    );
    expect(result.current.step).toBe("confirm");
    expect(mockedPostStockBeweging).not.toHaveBeenCalled();
  });

  it("books the movement and advances to the result step on success", async () => {
    stubSession();
    mockedGetArtikelScan.mockResolvedValue({
      status: "resolved",
      scan: "590123",
      article: resolvedArticle,
      empty: false,
    });
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

    const { result } = renderHook(() => useStockBeweging());
    await act(async () => {
      await result.current.submitScan("590123");
    });
    act(() => {
      result.current.setMovementType("ontvangst");
      result.current.setAantal("5");
      result.current.setOpm("Ontvangst levering");
    });
    act(() => {
      result.current.goToConfirm();
    });

    await act(async () => {
      await result.current.confirmBooking();
    });

    expect(mockedPostStockBeweging).toHaveBeenCalledWith(
      { artnr: "ART-1", movementType: "ontvangst", aantal: 5, opm: "Ontvangst levering" },
      "tok-1"
    );
    expect(result.current.step).toBe("result");
    expect(result.current.result).toEqual(bookingResult);
  });

  it("sends nieuwMagazijn without aantal/opm for transfer_intern", async () => {
    stubSession();
    mockedGetArtikelScan.mockResolvedValue({
      status: "resolved",
      scan: "590123",
      article: resolvedArticle,
      empty: false,
    });
    mockedPostStockBeweging.mockResolvedValue({
      artikel: { artnr: "ART-1", voorraad: 10, magazijn: "M2" },
      artlog: {
        artnr: "ART-1",
        lijnnr: 2,
        datum: "2026-01-01",
        uur: "11:00",
        beweging: "transfer_intern",
        aantal: 10,
        stock: 10,
        opm: "Auto",
        id: "2",
      },
    });

    const { result } = renderHook(() => useStockBeweging());
    await act(async () => {
      await result.current.submitScan("590123");
    });
    act(() => {
      result.current.setMovementType("transfer_intern");
      result.current.setNieuwMagazijn("M2");
    });
    act(() => {
      result.current.goToConfirm();
    });

    await act(async () => {
      await result.current.confirmBooking();
    });

    expect(mockedPostStockBeweging).toHaveBeenCalledWith(
      { artnr: "ART-1", movementType: "transfer_intern", nieuwMagazijn: "M2" },
      "tok-1"
    );
  });

  it("keeps the resolved article and stays on the confirm step when the booking fails", async () => {
    stubSession();
    mockedGetArtikelScan.mockResolvedValue({
      status: "resolved",
      scan: "590123",
      article: resolvedArticle,
      empty: false,
    });
    mockedPostStockBeweging.mockRejectedValue(
      new Error("Onvoldoende voorraad voor deze boeking (huidige voorraad: 3)")
    );

    const { result } = renderHook(() => useStockBeweging());
    await act(async () => {
      await result.current.submitScan("590123");
    });
    act(() => {
      result.current.setMovementType("correctie_min");
      result.current.setAantal("10");
      result.current.setOpm("Correctie na telling");
    });
    act(() => {
      result.current.goToConfirm();
    });

    await act(async () => {
      await result.current.confirmBooking();
    });

    expect(result.current.step).toBe("confirm");
    expect(result.current.article?.artnr).toBe("ART-1");
    expect(result.current.submitError).toBe(
      "Onvoldoende voorraad voor deze boeking (huidige voorraad: 3)"
    );
  });

  it("resets back to the artikel step via reset()", async () => {
    mockedGetArtikelScan.mockResolvedValue({
      status: "resolved",
      scan: "590123",
      article: resolvedArticle,
      empty: false,
    });
    const { result } = renderHook(() => useStockBeweging());
    await act(async () => {
      await result.current.submitScan("590123");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.step).toBe("artikel");
    expect(result.current.article).toBeNull();
  });
});
