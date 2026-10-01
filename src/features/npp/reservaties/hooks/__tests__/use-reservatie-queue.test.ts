import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNppReservatieQueue } from "@/lib/api-client";
import { useReservatieQueue } from "../use-reservatie-queue";

vi.mock("@/lib/api-client", () => ({ getNppReservatieQueue: vi.fn() }));
const mockGet = vi.mocked(getNppReservatieQueue);

describe("useReservatieQueue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads items for the mode", async () => {
    mockGet.mockResolvedValue({ mode: "direct", dringendDagen: 3, items: [] });
    const { result } = renderHook(() => useReservatieQueue("direct"));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.dringendDagen).toBe(3);
    expect(mockGet).toHaveBeenCalledWith("direct");
  });

  it("refetches when mode changes", async () => {
    mockGet.mockResolvedValue({ mode: "direct", dringendDagen: 3, items: [] });
    const { result, rerender } = renderHook(
      ({ mode }) => useReservatieQueue(mode),
      {
        initialProps: { mode: "direct" as "direct" | "productie" },
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ mode: "productie" });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenLastCalledWith("productie");
  });

  it("surfaces errors", async () => {
    mockGet.mockRejectedValue(new Error("Boem"));
    const { result } = renderHook(() => useReservatieQueue("direct"));
    await waitFor(() => expect(result.current.error).toBe("Boem"));
    expect(result.current.items).toBeNull();
  });

  it("refresh refetches", async () => {
    mockGet.mockResolvedValue({ mode: "direct", dringendDagen: 3, items: [] });
    const { result } = renderHook(() => useReservatieQueue("direct"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.refresh());
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
