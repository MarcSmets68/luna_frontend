import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VoorraadbewegingenCard } from "../voorraadbewegingen-card";
import type { DashboardVoorraadBewegingen } from "@/lib/api-client";

const data: DashboardVoorraadBewegingen = {
  aantalIn: 1187,
  aantalUit: 2214,
  aantalArtikelen: 96,
  topDalers: [
    { rang: 1, artnr: "123.206227", omschrijving: "Schroef M6x30 RVS", netto: -1340, aantalBewegingen: 41, huidigeVoorraad: 12, voorraadMin: 50 },
    { rang: 2, artnr: "456.001122", omschrijving: "Profiel 40x40 zwart", netto: -88.5, aantalBewegingen: 9, huidigeVoorraad: 130.5, voorraadMin: 0 },
  ],
};

describe("VoorraadbewegingenCard", () => {
  it("renders summary and rows with nl-BE formatting", () => {
    render(<VoorraadbewegingenCard data={data} error={false} />);
    expect(screen.getByText("Boekingen in")).toBeInTheDocument();
    expect(screen.getByText((1187).toLocaleString("nl-BE"))).toBeInTheDocument();
    expect(screen.getByText((2214).toLocaleString("nl-BE"))).toBeInTheDocument();
    expect(screen.getByText("96")).toBeInTheDocument();
    expect(screen.getByText("Schroef M6x30 RVS")).toBeInTheDocument();
    expect(screen.getByText((-1340).toLocaleString("nl-BE"))).toBeInTheDocument();
    expect(screen.getByText((-88.5).toLocaleString("nl-BE"))).toBeInTheDocument();
    expect(screen.getByText(/41 boekingen · voorraad 12 \(min\. 50\)/)).toBeInTheDocument();
    expect(screen.getByText(/voorraad 130,5$/)).toBeInTheDocument();
  });

  it("hides the min. suffix when voorraadMin is 0", () => {
    render(<VoorraadbewegingenCard data={data} error={false} />);
    expect(screen.getAllByText(/min\./)).toHaveLength(1);
  });

  it("uses neutral colour for netto", () => {
    render(<VoorraadbewegingenCard data={data} error={false} />);
    const el = screen.getByText((-88.5).toLocaleString("nl-BE"));
    expect(el.className).toContain("text-foreground");
    expect(el.className).not.toContain("text-destructive");
  });

  it("shows only the error copy when error is true", () => {
    render(<VoorraadbewegingenCard data={data} error={true} />);
    expect(screen.getByText("Kon voorraadbewegingen niet laden.")).toBeInTheDocument();
    expect(screen.queryByText("Boekingen in")).not.toBeInTheDocument();
    expect(screen.queryByText("Schroef M6x30 RVS")).not.toBeInTheDocument();
    expect(screen.queryByText(/Nog geen voorraadbewegingen/)).not.toBeInTheDocument();
  });

  it("shows empty state for null data", () => {
    render(<VoorraadbewegingenCard data={null} error={false} />);
    expect(screen.getByText("Nog geen voorraadbewegingen deze maand.")).toBeInTheDocument();
    expect(screen.queryByText("Boekingen in")).not.toBeInTheDocument();
  });

  it("shows empty state for zero movements", () => {
    render(<VoorraadbewegingenCard data={{ aantalIn: 0, aantalUit: 0, aantalArtikelen: 0, topDalers: [] }} error={false} />);
    expect(screen.getByText("Nog geen voorraadbewegingen deze maand.")).toBeInTheDocument();
    expect(screen.queryByText("Boekingen in")).not.toBeInTheDocument();
  });

  it("shows summary plus no-decline copy when topDalers is empty or missing", () => {
    const { rerender } = render(<VoorraadbewegingenCard data={{ ...data, topDalers: [] }} error={false} />);
    expect(screen.getByText("Boekingen in")).toBeInTheDocument();
    expect(screen.getByText("Geen artikelen met een netto voorraaddaling deze maand.")).toBeInTheDocument();
    const partial = { aantalIn: 5, aantalUit: 3, aantalArtikelen: 2 } as DashboardVoorraadBewegingen;
    rerender(<VoorraadbewegingenCard data={partial} error={false} />);
    expect(screen.getByText("Geen artikelen met een netto voorraaddaling deze maand.")).toBeInTheDocument();
  });

  it("applies truncate to long omschrijving", () => {
    const long = "X".repeat(200);
    render(
      <VoorraadbewegingenCard
        data={{ ...data, topDalers: [{ ...data.topDalers[0], omschrijving: long }] }}
        error={false}
      />,
    );
    expect(screen.getByText(long).className).toContain("truncate");
  });
});
