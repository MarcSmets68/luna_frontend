import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlanningQueue } from "../use-planning-queue";

const getPlanningQueue = vi.fn();
vi.mock("@/lib/api-client", () => ({
  getPlanningQueue: () => getPlanningQueue(),
}));

const ITEM = {
  bonnr: 1,
  groepnr: 1,
  lijnnr: 1,
  klant: "K",
  artnr: "A",
  omschrijving: "O",
  aantal: 2,
  levDatum: null,
};

describe("usePlanningQueue", () => {
  beforeEach(() => {
    getPlanningQueue.mockReset();
  });

  it("fetches on mount", async () => {
    getPlanningQueue.mockResolvedValue({ items: [ITEM] });
    const { result } = renderHook(() => usePlanningQueue());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([ITEM]);
    expect(result.current.error).toBeNull();
  });

  it("treats an empty array as a valid result", async () => {
    getPlanningQueue.mockResolvedValue({ items: [] });
    const { result } = renderHook(() => usePlanningQueue());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("exposes the error message on failure", async () => {
    getPlanningQueue.mockRejectedValue(new Error("Boem"));
    const { result } = renderHook(() => usePlanningQueue());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Boem");
    expect(result.current.items).toBeNull();
  });

  it("refresh refetches", async () => {
    getPlanningQueue.mockResolvedValue({ items: [] });
    const { result } = renderHook(() => usePlanningQueue());
    await waitFor(() => expect(result.current.loading).toBe(false));
    getPlanningQueue.mockResolvedValue({ items: [ITEM] });
    await act(async () => {
      await result.current.refresh();
    });
    expect(getPlanningQueue).toHaveBeenCalledTimes(2);
    expect(result.current.items).toEqual([ITEM]);
  });
});
