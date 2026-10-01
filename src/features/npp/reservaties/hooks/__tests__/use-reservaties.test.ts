import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReservaties } from "../use-reservaties";
import type { ReservatieDetail, ReservatieQueueItem } from "../../types";

const getReservatieQueue = vi.fn();
const getReservatieDetail = vi.fn();
vi.mock("@/lib/api-client", () => ({
  getReservatieQueue: (mode: string) => getReservatieQueue(mode),
  getReservatieDetail: (bonnr: number, groepnr: number) => getReservatieDetail(bonnr, groepnr),
}));

const ITEM: ReservatieQueueItem = {
  bonnr: 20345,
  groepnr: 0,
  datum: "2026-09-01",
  levDatum: "2026-09-10",
  naam: "Jansen",
  plaatsingWijze: "",
  transport: "",
  stempel: "",
  lockId: "",
  dringend: false,
  swReservatie: true,
  swProductie: false,
  swNomaled: false,
  verwijderd: false,
  deleteOpm: null,
};

const DETAIL: ReservatieDetail = { bonnr: 20345, groepnr: 0, nBedrag: 0, items: [] };

function queue(mode: "direct" | "productie", items: ReservatieQueueItem[]) {
  return { mode, dringendDagen: 0, items };
}

describe("useReservaties", () => {
  beforeEach(() => {
    getReservatieQueue.mockReset();
    getReservatieDetail.mockReset();
  });

  it("fetches the direct queue on mount", async () => {
    getReservatieQueue.mockResolvedValue(queue("direct", [ITEM]));
    const { result } = renderHook(() => useReservaties());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getReservatieQueue).toHaveBeenCalledWith("direct");
    expect(result.current.mode).toBe("direct");
    expect(result.current.items).toEqual([ITEM]);
    expect(result.current.error).toBeNull();
  });

  it("exposes the error message on failure", async () => {
    getReservatieQueue.mockRejectedValue(new Error("Boem"));
    const { result } = renderHook(() => useReservaties());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Boem");
    expect(result.current.items).toBeNull();
  });

  it("refetches for the new mode on setMode and ignores the superseded response", async () => {
    let resolveDirect!: (v: unknown) => void;
    getReservatieQueue.mockReturnValueOnce(new Promise((r) => (resolveDirect = r)));
    const { result } = renderHook(() => useReservaties());

    const productieItem = { ...ITEM, groepnr: 2 };
    getReservatieQueue.mockResolvedValueOnce(queue("productie", [productieItem]));
    await act(async () => {
      await result.current.setMode("productie");
    });
    await act(async () => {
      resolveDirect(queue("direct", [ITEM]));
    });

    expect(getReservatieQueue).toHaveBeenLastCalledWith("productie");
    expect(result.current.mode).toBe("productie");
    expect(result.current.items).toEqual([productieItem]);
  });

  it("refresh refetches the current mode", async () => {
    getReservatieQueue.mockResolvedValue(queue("direct", []));
    const { result } = renderHook(() => useReservaties());
    await waitFor(() => expect(result.current.loading).toBe(false));
    getReservatieQueue.mockResolvedValue(queue("direct", [ITEM]));
    await act(async () => {
      await result.current.refresh();
    });
    expect(getReservatieQueue).toHaveBeenCalledTimes(2);
    expect(result.current.items).toEqual([ITEM]);
  });

  it("opens and closes the detail of a queue row", async () => {
    getReservatieQueue.mockResolvedValue(queue("direct", [ITEM]));
    getReservatieDetail.mockResolvedValue(DETAIL);
    const { result } = renderHook(() => useReservaties());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.openDetail(ITEM);
    });
    expect(getReservatieDetail).toHaveBeenCalledWith(20345, 0);
    expect(result.current.selected).toEqual(ITEM);
    expect(result.current.detail).toEqual(DETAIL);
    expect(result.current.detailLoading).toBe(false);

    act(() => {
      result.current.closeDetail();
    });
    expect(result.current.selected).toBeNull();
    expect(result.current.detail).toBeNull();
  });

  it("exposes the detail error", async () => {
    getReservatieQueue.mockResolvedValue(queue("direct", [ITEM]));
    getReservatieDetail.mockRejectedValue(new Error("Bon 20345 not found"));
    const { result } = renderHook(() => useReservaties());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.openDetail(ITEM);
    });
    expect(result.current.detailError).toBe("Bon 20345 not found");
    expect(result.current.detail).toBeNull();
  });
});
