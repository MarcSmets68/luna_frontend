import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import Voorraad from "@/app/voorraad/page";
import { getArtikelen } from "@/lib/api-client";
import { VoorraadPage } from "../voorraad-page";
import { aanvullingFixtureBron } from "../../lib/aanvulling-fixtures";

vi.mock("@/lib/api-client", () => ({ getArtikelen: vi.fn() }));
vi.mock("@/components/layout/app-shell", () => ({ AppShell: ({ children }: { children: ReactNode }) => children }));
vi.mock("../voorraad-page", () => ({ VoorraadPage: vi.fn(() => null) }));

describe("voorraad route search", () => {
  it("passes all URL filters to the backend instead of filtering the current page locally", async () => {
    vi.mocked(getArtikelen).mockResolvedValue({ items: [], page: 3, pageSize: 25, hasMore: false });
    render(await Voorraad({ searchParams: Promise.resolve({ page: "3", artnr: "100%", omschrijving: "LED & wit", lageVoorraad: "true", toonGeblokkeerd: "true" }) }));
    expect(getArtikelen).toHaveBeenCalledWith(3, 25, { lageVoorraad: true, geblokkeerd: undefined, artnr: "100%", omschrijving: "LED & wit" });
    expect(vi.mocked(VoorraadPage).mock.calls[0][0]).toMatchObject({ page: 3, artnr: "100%", omschrijving: "LED & wit", lageVoorraad: true, toonGeblokkeerd: true });
  });
});

describe("voorraad route aanvulling nakijken", () => {
  it("houdt externe voorraad, open inkoop en onbekende levering apart van het dringende signaal", async () => {
    vi.mocked(getArtikelen).mockClear();
    render(await Voorraad({ searchParams: Promise.resolve({ weergave: "aanvulling", zoek: "VB-108" }) }));
    expect(getArtikelen).not.toHaveBeenCalled();
    expect(screen.getByText("Peildatum: Onbekend")).toBeVisible();
    expect(screen.getByText("Voorbeeldgegevens")).toBeVisible();
    const row = screen.getByRole("row", { name: /VB-108/ });
    expect(within(row).getByText("Dringend")).toBeVisible();
    expect(within(row).getByText("Intern beschikbaar is nul of negatief.")).toBeVisible();
    expect(within(row).getByText("Aantal: 20")).toBeVisible();
    expect(within(row).getByText("Gereserveerd: 4")).toBeVisible();
    expect(within(row).getByText("30")).toBeVisible();
    expect(within(row).getByText("Onbekend")).toBeVisible();
    expect(within(row).getByText("0")).toBeVisible();
  });

  it("toont bij een onbereikbare bron een fout in plaats van een leeg resultaat", async () => {
    const lees = vi.spyOn(aanvullingFixtureBron, "lees").mockRejectedValueOnce(new Error("onbereikbaar"));
    try {
      render(await Voorraad({ searchParams: Promise.resolve({ weergave: "aanvulling" }) }));
      expect(within(screen.getByRole("alert")).getByText("Voorraadgegevens niet beschikbaar")).toBeVisible();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.queryByText(/geen tekorten|geen artikelen/i)).not.toBeInTheDocument();
    } finally {
      lees.mockRestore();
    }
  });

  it("waarschuwt als de bron afgekapt én verouderd is, ook bij een leeg resultaat", async () => {
    const lees = vi.spyOn(aanvullingFixtureBron, "lees").mockResolvedValueOnce({
      artikelen: [], peildatum: "2024-01-02", volledigheid: "afgekapt", actualiteit: "verouderd", bron: "voorbeeld",
    });
    try {
      render(await Voorraad({ searchParams: Promise.resolve({ weergave: "aanvulling" }) }));
      const waarschuwing = within(screen.getByRole("status"));
      expect(waarschuwing.getByText(/Onvolledige werklijst/)).toBeVisible();
      expect(waarschuwing.getByText(/Verouderde voorraadgegevens/)).toBeVisible();
      expect(screen.getByText("2/1/2024")).toHaveAttribute("dateTime", "2024-01-02");
    } finally {
      lees.mockRestore();
    }
  });
});
