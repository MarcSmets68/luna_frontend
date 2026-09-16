import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PakbonnenPage } from "../pakbonnen-page";
import type { PakbonItem } from "@/lib/api-client";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const mockItems: PakbonItem[] = [
  {
    paknr: 500,
    stempel: "OPEN",
    datum: "2026-08-07",
    klnr: 14644,
    naam: "CONE LIGHTING BV",
    naam1: "",
    adres: "Straat 1",
    postnr: "2170",
    stad: "MERKSEM",
    lnaam: "",
    ladres: "",
    lpostnr: "",
    lstad: "",
    munt: "EUR",
    nBedrag: 100,
    bBedrag: 0,
    totBtw: 21,
    uRef: "",
    opm: "",
    swProforma: false,
    facnr: 0,
    batchnr: 0,
    validatie: false,
    afgedrukt: false,
    afgehaald: false,
    afgehaaldId: "",
    afgehaaldDatum: null,
    afgehaaldUur: "",
    compleet: false,
    tracknr: "",
    verzending: "",
    projectnr: 0,
  },
];

describe("PakbonnenPage", () => {
  it("renders the pakbon list with paknr and klant", () => {
    render(<PakbonnenPage items={mockItems} page={1} hasMore={false} />);
    expect(screen.getByRole("heading", { name: "Pakbonnen" })).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("CONE LIGHTING BV")).toBeInTheDocument();
  });

  it("shows an empty state when there are no pakbonnen", () => {
    render(<PakbonnenPage items={[]} page={1} hasMore={false} />);
    expect(screen.getByText("Geen pakbonnen gevonden.")).toBeInTheDocument();
  });

  it("navigates to the pakbon detail page on row click", async () => {
    render(<PakbonnenPage items={mockItems} page={1} hasMore={false} />);
    fireEvent.click(screen.getByRole("link", { name: "Open pakbon 500" }));
    expect(pushMock).toHaveBeenCalledWith("/pakbonnen/500");
  });
});
