import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ArtikelArtlogTab } from "../artikel-artlog-tab";
import type { ArtlogItem } from "@/lib/api-client";

const getArtlogMock = vi.fn();

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    getArtlog: (...args: unknown[]) => getArtlogMock(...args),
  };
});

function makeItem(overrides: Partial<ArtlogItem> = {}): ArtlogItem {
  return {
    artnr: "AB123",
    lijnnr: 42,
    datum: "2026-08-10",
    uur: "14:32:05",
    beweging: "A",
    aantal: 10,
    stock: 110,
    docnr: "BON-2177435",
    omschr: "Ontvangst leverancier X",
    kllev: 623,
    naam: "ALUCOL BV",
    aprijs: 12.5,
    munt: "EUR",
    koers: 1.0,
    opm: "",
    refLev: "REF-99",
    id: "mverbist",
    swControle: false,
    cdatum: null,
    ...overrides,
  };
}

describe("ArtikelArtlogTab", () => {
  beforeEach(() => {
    getArtlogMock.mockReset();
  });

  it("fetches page 1 for the given artnr on mount", async () => {
    getArtlogMock.mockResolvedValue({ items: [makeItem()], page: 1, pageSize: 25, hasMore: false });
    render(<ArtikelArtlogTab artnr="AB123" />);
    await waitFor(() =>
      expect(getArtlogMock).toHaveBeenCalledWith("AB123", { page: 1, pageSize: 25 })
    );
  });

  it("renders the beweging code as a raw, untranslated monospace badge", async () => {
    getArtlogMock.mockResolvedValue({ items: [makeItem()], page: 1, pageSize: 25, hasMore: false });
    render(<ArtikelArtlogTab artnr="AB123" />);
    expect(await screen.findByText("A")).toBeInTheDocument();
    expect(screen.getByText(/bewegingscodes zijn nog niet vertaald/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no bewegingen", async () => {
    getArtlogMock.mockResolvedValue({ items: [], page: 1, pageSize: 25, hasMore: false });
    render(<ArtikelArtlogTab artnr="AB123" />);
    expect(await screen.findByText("Geen bewegingen gevonden.")).toBeInTheDocument();
  });

  it("paginates locally without affecting the main page URL", async () => {
    getArtlogMock.mockResolvedValueOnce({
      items: [makeItem({ lijnnr: 1, docnr: "PAGE-1" })],
      page: 1,
      pageSize: 25,
      hasMore: true,
    });
    const user = userEvent.setup();
    render(<ArtikelArtlogTab artnr="AB123" />);
    expect(await screen.findByText("PAGE-1")).toBeInTheDocument();

    getArtlogMock.mockResolvedValueOnce({
      items: [makeItem({ lijnnr: 2, docnr: "PAGE-2" })],
      page: 2,
      pageSize: 25,
      hasMore: false,
    });
    await user.click(screen.getByRole("button", { name: /volgende/i }));

    expect(await screen.findByText("PAGE-2")).toBeInTheDocument();
    await waitFor(() =>
      expect(getArtlogMock).toHaveBeenLastCalledWith("AB123", { page: 2, pageSize: 25 })
    );
  });

  it("shows an error message when the fetch fails", async () => {
    getArtlogMock.mockRejectedValue(new Error("network error"));
    render(<ArtikelArtlogTab artnr="AB123" />);
    expect(await screen.findByText(/kon bewegingen niet ophalen/i)).toBeInTheDocument();
  });
});
