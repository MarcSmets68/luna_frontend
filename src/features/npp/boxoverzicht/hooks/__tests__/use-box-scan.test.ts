import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBoxScan } from "../use-box-scan";
import { getBoxOverzicht } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({ getBoxOverzicht: vi.fn() }));
const mockedGetBoxOverzicht = vi.mocked(getBoxOverzicht);

describe("useBoxScan", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("sets loading while the request is in flight, then result on success", async () => {
    let resolve!: (value: unknown) => void;
    mockedGetBoxOverzicht.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = renderHook(() => useBoxScan());

    expect(result.current.result).toBeNull();

    act(() => {
      void result.current.submitScan("B1-1");
    });
    expect(result.current.loading).toBe(true);

    const data = { bonnr: 1, groepnr: 1, klant: "K", opmerking: "niets", empty: false, articles: [] };
    await act(async () => {
      resolve(data);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.result).toEqual(data);
    expect(result.current.error).toBeNull();
  });

  it("sets error and clears result on a failed scan", async () => {
    mockedGetBoxOverzicht.mockRejectedValue(new Error("Bon niet gevonden"));
    const { result } = renderHook(() => useBoxScan());

    await act(async () => {
      await result.current.submitScan("999-1");
    });

    expect(result.current.error).toBe("Bon niet gevonden");
    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("replaces the previous result in place on a second submitScan call", async () => {
    mockedGetBoxOverzicht.mockResolvedValueOnce({
      bonnr: 1,
      groepnr: 1,
      klant: "A",
      opmerking: "niets",
      empty: false,
      articles: [],
    });
    const { result } = renderHook(() => useBoxScan());

    await act(async () => {
      await result.current.submitScan("1-1");
    });
    expect(result.current.result?.bonnr).toBe(1);

    mockedGetBoxOverzicht.mockResolvedValueOnce({
      bonnr: 2,
      groepnr: 1,
      klant: "B",
      opmerking: "niets",
      empty: false,
      articles: [],
    });

    await act(async () => {
      await result.current.submitScan("2-1");
    });
    expect(result.current.result?.bonnr).toBe(2);
  });
});
