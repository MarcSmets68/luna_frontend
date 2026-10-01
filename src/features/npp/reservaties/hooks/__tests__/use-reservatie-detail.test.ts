import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNppReservatieDetail } from "@/lib/api-client";
import { useReservatieDetail } from "../use-reservatie-detail";

vi.mock("@/lib/api-client", () => ({ getNppReservatieDetail: vi.fn() }));
const mockGet = vi.mocked(getNppReservatieDetail);

describe("useReservatieDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the detail", async () => {
    const detail = { bonnr: 5, groepnr: 2, nBedrag: 10, items: [] };
    mockGet.mockResolvedValue(detail);
    const { result } = renderHook(() => useReservatieDetail(5, 2));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(detail));
    expect(result.current.loading).toBe(false);
    expect(mockGet).toHaveBeenCalledWith(5, 2);
  });

  it("surfaces errors", async () => {
    mockGet.mockRejectedValue(new Error("Bon niet gevonden"));
    const { result } = renderHook(() => useReservatieDetail(9));
    await waitFor(() => expect(result.current.error).toBe("Bon niet gevonden"));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
