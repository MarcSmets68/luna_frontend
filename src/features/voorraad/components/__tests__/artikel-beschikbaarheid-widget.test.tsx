import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ArtikelBeschikbaarheidWidget } from "../artikel-beschikbaarheid-widget";
import type { Beschikbaarheid } from "@/lib/api-client";

const getArtikelBeschikbaarheidMock = vi.fn();

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return {
    ...actual,
    getArtikelBeschikbaarheid: (...args: unknown[]) => getArtikelBeschikbaarheidMock(...args),
  };
});

const samengesteld: Beschikbaarheid = {
  artnr: "LED-PROFIEL-01",
  isSamengesteld: true,
  bouwbareEenheden: 12.5,
  siktaUitzonderingToegepast: false,
  componenten: [
    {
      componentArtnr: "SAPA.RAE.46990.AT",
      componentOmschrijving: "1D LED profiel",
      benodigdPerEenheid: 2,
      componentVoorraad: 25,
      bouwbaarUitDitComponent: 12.5,
      isBottleneck: true,
    },
    {
      componentArtnr: "SCHROEF-M4",
      componentOmschrijving: "Schroef M4x10",
      benodigdPerEenheid: 4,
      componentVoorraad: 500,
      bouwbaarUitDitComponent: 125.0,
      isBottleneck: false,
    },
  ],
};

const nietSamengesteld: Beschikbaarheid = {
  artnr: "SCHROEF-M4",
  isSamengesteld: false,
  bouwbareEenheden: null,
  siktaUitzonderingToegepast: false,
  componenten: [],
};

describe("ArtikelBeschikbaarheidWidget", () => {
  beforeEach(() => {
    getArtikelBeschikbaarheidMock.mockReset();
  });

  it("fetches beschikbaarheid for the given artnr on mount", async () => {
    getArtikelBeschikbaarheidMock.mockResolvedValue(samengesteld);
    render(<ArtikelBeschikbaarheidWidget artnr="LED-PROFIEL-01" />);
    await waitFor(() => expect(getArtikelBeschikbaarheidMock).toHaveBeenCalledWith("LED-PROFIEL-01"));
  });

  it("shows a loading state before the fetch resolves", () => {
    getArtikelBeschikbaarheidMock.mockReturnValue(new Promise(() => {}));
    render(<ArtikelBeschikbaarheidWidget artnr="LED-PROFIEL-01" />);
    expect(screen.getByText(/wordt berekend/i)).toBeInTheDocument();
  });

  it("renders bouwbare eenheden and the component table with a bottleneck highlight", async () => {
    getArtikelBeschikbaarheidMock.mockResolvedValue(samengesteld);
    render(<ArtikelBeschikbaarheidWidget artnr="LED-PROFIEL-01" />);

    expect((await screen.findAllByText("12.5")).length).toBeGreaterThan(0);
    expect(screen.getByText("SAPA.RAE.46990.AT")).toBeInTheDocument();
    expect(screen.getByText("SCHROEF-M4")).toBeInTheDocument();
    expect(screen.getByText("Bottleneck")).toBeInTheDocument();
  });

  it("shows an empty state for a non-composite artikel instead of '0 bouwbaar'", async () => {
    getArtikelBeschikbaarheidMock.mockResolvedValue(nietSamengesteld);
    render(<ArtikelBeschikbaarheidWidget artnr="SCHROEF-M4" />);

    expect(await screen.findByText(/geen samengesteld artikel/i)).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows an error message when the fetch fails", async () => {
    getArtikelBeschikbaarheidMock.mockRejectedValue(new Error("network error"));
    render(<ArtikelBeschikbaarheidWidget artnr="LED-PROFIEL-01" />);
    expect(await screen.findByText(/kon beschikbaarheid niet ophalen/i)).toBeInTheDocument();
  });
});
